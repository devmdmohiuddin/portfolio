/**
 * Read-only data provider for the portfolio site.
 *
 * All getters are cacheable so Experience Cloud can serve them from the Lightning
 * cache/CDN. Content is data: the site re-renders whenever records or the
 * Portfolio_Config__mdt "Default" record change — no redeploy required.
 */
public with sharing class PortfolioController {
  @TestVisible
  private static final String CONFIG_RECORD = 'Default';

  /**
   * Singleton site configuration. Falls back to an empty record so the UI can
   * bind safely even before the Default CMDT record exists.
   *
   * Queried with SOQL (not getInstance) because getInstance truncates long
   * text area fields such as About__c to 255 characters.
   */
  @AuraEnabled(cacheable=true)
  public static Portfolio_Config__mdt getConfig() {
    try {
      List<Portfolio_Config__mdt> configs = [
        SELECT
          Full_Name__c,
          Tagline__c,
          Roles__c,
          Intro__c,
          About__c,
          Photo_URL__c,
          Tech_List__c,
          Email__c,
          Notification_Email__c,
          Resume_URL__c,
          GitHub_URL__c,
          LinkedIn_URL__c,
          Twitter_URL__c,
          Instagram_URL__c,
          Availability_Message__c
        FROM Portfolio_Config__mdt
        WHERE DeveloperName = :CONFIG_RECORD
        LIMIT 1
      ];
      if (!configs.isEmpty()) {
        return configs[0];
      }
    } catch (System.QueryException e) {
      // Users without CMDT object access (e.g. a guest profile missing the
      // customMetadataTypeAccesses grant) can't SOQL custom metadata; fall
      // through to getInstance, which needs no grant but truncates long
      // text fields to 255 characters.
    }
    Portfolio_Config__mdt config = Portfolio_Config__mdt.getInstance(
      CONFIG_RECORD
    );
    return config != null ? config : new Portfolio_Config__mdt();
  }

  /**
   * "Where I've Worked" tabs, ordered for display.
   */
  @AuraEnabled(cacheable=true)
  public static List<Experience__c> getExperiences() {
    return [
      SELECT
        Id,
        Name,
        Role__c,
        Company_URL__c,
        Start_Date__c,
        End_Date__c,
        Is_Current__c,
        Sort_Order__c,
        Highlights__c
      FROM Experience__c
      WITH USER_MODE
      ORDER BY Sort_Order__c ASC NULLS LAST, Start_Date__c DESC
    ];
  }

  /**
   * Published projects of the given type ("Featured" or "Other") with their
   * tech tags, ordered for display.
   *
   * @param type Project_Type value; defaults to "Featured" when blank.
   */
  @AuraEnabled(cacheable=true)
  public static List<Project__c> getProjects(String type) {
    String projectType = String.isBlank(type) ? 'Featured' : type;
    return [
      SELECT
        Id,
        Name,
        Description__c,
        Type__c,
        Sort_Order__c,
        GitHub_URL__c,
        External_URL__c,
        Image_URL__c,
        Is_Published__c,
        Show_In_Archive__c,
        (SELECT Id, Name FROM Project_Techs__r ORDER BY Name ASC)
      FROM Project__c
      WHERE Type__c = :projectType AND Is_Published__c = TRUE
      WITH USER_MODE
      ORDER BY Sort_Order__c ASC NULLS LAST, Name ASC
    ];
  }
}
