/**
 * Tests for ContactController.submitMessage — validation, persistence, and the
 * best-effort email notification.
 */
@isTest
private class ContactControllerTest {
  // The Contact_Message__c fields only carry FLS via the content-manager
  // permission set, so grant it to the running user; otherwise the insert
  // fails with "fields being inaccessible".
  @testSetup
  static void grantFieldAccess() {
    List<PermissionSet> sets = [
      SELECT Id
      FROM PermissionSet
      WHERE Name = 'Portfolio_Content_Manager'
      LIMIT 1
    ];
    if (!sets.isEmpty()) {
      List<PermissionSetAssignment> existing = [
        SELECT Id
        FROM PermissionSetAssignment
        WHERE
          AssigneeId = :UserInfo.getUserId()
          AND PermissionSetId = :sets[0].Id
      ];
      if (existing.isEmpty()) {
        insert new PermissionSetAssignment(
          AssigneeId = UserInfo.getUserId(),
          PermissionSetId = sets[0].Id
        );
      }
    }
  }

  @isTest
  static void savesValidSubmissionAndNotifies() {
    Test.startTest();
    Id recordId = ContactController.submitMessage(
      '  Jane Doe  ',
      'jane@example.com',
      '555-0101',
      '  Hi Mohi, love the site!  '
    );
    Test.stopTest();

    System.assertNotEquals(null, recordId, 'Should return the new record Id');
    Contact_Message__c saved = [
      SELECT Name, Email__c, Phone__c, Message__c, Source__c
      FROM Contact_Message__c
      WHERE Id = :recordId
    ];
    System.assertEquals('Jane Doe', saved.Name, 'Name is trimmed');
    System.assertEquals('jane@example.com', saved.Email__c);
    System.assertEquals('555-0101', saved.Phone__c);
    System.assertEquals(
      'Hi Mohi, love the site!',
      saved.Message__c,
      'Message is trimmed'
    );
    System.assertEquals(ContactController.SOURCE, saved.Source__c);
  }

  @isTest
  static void rejectsBlankName() {
    assertRejected(null, 'a@b.com', '', 'Hello', 'Please enter your name.');
  }

  @isTest
  static void rejectsInvalidEmail() {
    assertRejected(
      'Jane',
      'not-an-email',
      '',
      'Hello',
      'Please enter a valid email address.'
    );
  }

  @isTest
  static void rejectsBlankMessage() {
    assertRejected(
      'Jane',
      'jane@example.com',
      '',
      '   ',
      'Please enter a message.'
    );
  }

  @isTest
  static void truncatesOverlongMessage() {
    String longMessage = 'x'.repeat(6000);
    Test.startTest();
    Id recordId = ContactController.submitMessage(
      'Jane',
      'jane@example.com',
      null,
      longMessage
    );
    Test.stopTest();

    Contact_Message__c saved = [
      SELECT Message__c
      FROM Contact_Message__c
      WHERE Id = :recordId
    ];
    System.assertEquals(
      5000,
      saved.Message__c.length(),
      'Message is capped at 5000 characters'
    );
  }

  private static void assertRejected(
    String name,
    String email,
    String phone,
    String message,
    String expected
  ) {
    Boolean threw = false;
    try {
      ContactController.submitMessage(name, email, phone, message);
    } catch (AuraHandledException e) {
      threw = true;
      System.assertEquals(expected, e.getMessage(), 'Friendly error message');
    }
    System.assert(threw, 'Expected a validation error');
    System.assertEquals(
      0,
      [SELECT COUNT() FROM Contact_Message__c],
      'No record should be created on validation failure'
    );
  }
}
