/**
 * Handles "Get In Touch" form submissions from the public portfolio site.
 *
 * Runs `without sharing` so the site's guest user can create a
 * Contact_Message__c record (the guest profile grants Create on the object).
 * Every submission is stored as a record and — best effort — emailed to the
 * owner's notification address so nothing is missed even if email delivery is
 * disabled in the org.
 */
public without sharing class ContactController {
  @TestVisible
  private static final String CONFIG_RECORD = 'Default';
  @TestVisible
  private static final String SOURCE = 'Portfolio Site';
  // Fallback recipient when Portfolio_Config__mdt.Notification_Email__c is blank.
  @TestVisible
  private static final String DEFAULT_NOTIFY = 'themdmohiuddin@gmail.com';
  private static final Integer MAX_MESSAGE = 5000;

  /**
   * Persist a contact message and notify the owner.
   *
   * @param name    sender's name (required)
   * @param email   sender's email (required, must look like an address)
   * @param phone   sender's phone (optional)
   * @param message the message body (required)
   * @return the Id of the created Contact_Message__c record
   */
  @AuraEnabled
  public static Id submitMessage(
    String name,
    String email,
    String phone,
    String message
  ) {
    String cleanName = safeTrim(name);
    String cleanEmail = safeTrim(email);
    String cleanPhone = safeTrim(phone);
    String cleanMessage = safeTrim(message);

    if (String.isBlank(cleanName)) {
      throw error('Please enter your name.');
    }
    if (String.isBlank(cleanEmail) || !isValidEmail(cleanEmail)) {
      throw error('Please enter a valid email address.');
    }
    if (String.isBlank(cleanMessage)) {
      throw error('Please enter a message.');
    }
    if (cleanMessage.length() > MAX_MESSAGE) {
      cleanMessage = cleanMessage.substring(0, MAX_MESSAGE);
    }

    Contact_Message__c record = new Contact_Message__c(
      Name = cleanName.abbreviate(80),
      Email__c = cleanEmail,
      Phone__c = cleanPhone,
      Message__c = cleanMessage,
      Source__c = SOURCE
    );

    try {
      insert record;
    } catch (DmlException e) {
      System.debug(
        LoggingLevel.ERROR,
        'Contact insert failed: ' + e.getMessage()
      );
      throw error('Sorry, something went wrong. Please try again.');
    }

    // Send the notification asynchronously. A guest user (the public site
    // visitor) can't send email synchronously — Salesforce's guest-user
    // security blocks it — so we hand off to a @future method, which runs in
    // an async context where the send succeeds. The record is already saved,
    // so a failed email never affects the visitor's submission.
    notifyAsync(
      resolveNotifyAddress(),
      record.Name,
      record.Email__c,
      record.Phone__c,
      record.Message__c
    );
    return record.Id;
  }

  /** Best-effort email notification, sent from an async (non-guest) context. */
  @future
  private static void notifyAsync(
    String recipient,
    String name,
    String email,
    String phone,
    String message
  ) {
    if (String.isBlank(recipient)) {
      return;
    }
    try {
      Messaging.SingleEmailMessage mail = new Messaging.SingleEmailMessage();
      mail.setToAddresses(new List<String>{ recipient });
      if (String.isNotBlank(email)) {
        mail.setReplyTo(email);
      }
      mail.setSubject('New portfolio message from ' + name);
      mail.setSaveAsActivity(false);
      mail.setPlainTextBody(
        'You received a new message from your portfolio site.\n\n' +
          'Name:  ' +
          name +
          '\n' +
          'Email: ' +
          email +
          '\n' +
          'Phone: ' +
          (String.isBlank(phone) ? '—' : phone) +
          '\n\n' +
          'Message:\n' +
          message
      );
      Messaging.sendEmail(new List<Messaging.SingleEmailMessage>{ mail });
    } catch (Exception e) {
      // Deliverability may be off in the org; the record is already saved.
      System.debug(
        LoggingLevel.WARN,
        'Contact notification email failed: ' + e.getMessage()
      );
    }
  }

  private static String resolveNotifyAddress() {
    try {
      List<Portfolio_Config__mdt> configs = [
        SELECT Notification_Email__c
        FROM Portfolio_Config__mdt
        WHERE DeveloperName = :CONFIG_RECORD
        LIMIT 1
      ];
      if (
        !configs.isEmpty() &&
        String.isNotBlank(configs[0].Notification_Email__c)
      ) {
        return configs[0].Notification_Email__c;
      }
    } catch (System.QueryException e) {
      // Fall through to the default recipient.
    }
    return DEFAULT_NOTIFY;
  }

  private static Boolean isValidEmail(String value) {
    return Pattern.matches(
      '^[a-zA-Z0-9._%+\\-]+@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,}$',
      value
    );
  }

  private static String safeTrim(String value) {
    return value == null ? null : value.trim();
  }

  private static AuraHandledException error(String message) {
    AuraHandledException e = new AuraHandledException(message);
    e.setMessage(message);
    return e;
  }
}
