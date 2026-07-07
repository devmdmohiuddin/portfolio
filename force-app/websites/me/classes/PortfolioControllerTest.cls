/**
 * Tests for PortfolioController cacheable getters.
 *
 * The controller queries WITH USER_MODE, so tests run as a dedicated content
 * manager holding the Portfolio_Content_Manager permission set. This both
 * satisfies field-level security and proves a non-admin can manage the data.
 */
@IsTest
private class PortfolioControllerTest {
  private static final String CM_LAST_NAME = 'PortfolioCM';

  @TestSetup
  static void seed() {
    User manager = createContentManager();

    // System.runAs both grants the manager's FLS and separates the User
    // (setup object) DML from the content DML to avoid MIXED_DML errors.
    System.runAs(manager) {
      Project__c featured = new Project__c(
        Name = 'Featured One',
        Description__c = 'A featured build.',
        Type__c = 'Featured',
        Sort_Order__c = 1,
        GitHub_URL__c = 'https://github.com/devmdmohiuddin/featured-one',
        External_URL__c = 'https://example.com/featured-one',
        Image_URL__c = 'https://example.com/featured-one.png',
        Is_Published__c = true
      );
      Project__c other = new Project__c(
        Name = 'Other One',
        Description__c = 'A smaller build.',
        Type__c = 'Other',
        Sort_Order__c = 1,
        Is_Published__c = true
      );
      Project__c unpublished = new Project__c(
        Name = 'Hidden',
        Type__c = 'Featured',
        Sort_Order__c = 2,
        Is_Published__c = false
      );
      insert new List<Project__c>{ featured, other, unpublished };

      insert new List<Project_Tech__c>{
        new Project_Tech__c(Name = 'Apex', Project__c = featured.Id),
        new Project_Tech__c(Name = 'LWC', Project__c = featured.Id)
      };

      insert new List<Experience__c>{
        new Experience__c(
          Name = 'Acme Corp',
          Role__c = 'Senior Developer',
          Company_URL__c = 'https://acme.example.com',
          Start_Date__c = Date.newInstance(2022, 1, 1),
          Is_Current__c = true,
          Sort_Order__c = 1,
          Highlights__c = 'Shipped things\nMore things'
        ),
        new Experience__c(
          Name = 'Globex',
          Role__c = 'Developer',
          Start_Date__c = Date.newInstance(2020, 1, 1),
          End_Date__c = Date.newInstance(2021, 12, 31),
          Sort_Order__c = 2,
          Highlights__c = 'Did work'
        )
      };
    }
  }

  /**
   * Creates a non-admin user assigned the Portfolio_Content_Manager permission
   * set so DML and USER_MODE queries have the required object/field access.
   */
  private static User createContentManager() {
    Profile standard = [
      SELECT Id
      FROM Profile
      WHERE Name = 'Standard User'
      LIMIT 1
    ];
    String unique =
      'portfolio.cm.' +
      DateTime.now().getTime() +
      '@example.com.invalid';
    User manager = new User(
      FirstName = 'Portfolio',
      LastName = CM_LAST_NAME,
      Email = 'portfolio.cm@example.com',
      Username = unique,
      Alias = 'pcm',
      TimeZoneSidKey = 'America/New_York',
      LocaleSidKey = 'en_US',
      EmailEncodingKey = 'UTF-8',
      LanguageLocaleKey = 'en_US',
      ProfileId = standard.Id
    );
    insert manager;

    PermissionSet permSet = [
      SELECT Id
      FROM PermissionSet
      WHERE Name = 'Portfolio_Content_Manager'
      LIMIT 1
    ];
    insert new PermissionSetAssignment(
      AssigneeId = manager.Id,
      PermissionSetId = permSet.Id
    );
    return manager;
  }

  private static User getContentManager() {
    return [
      SELECT Id
      FROM User
      WHERE LastName = :CM_LAST_NAME
      ORDER BY CreatedDate DESC
      LIMIT 1
    ];
  }

  @IsTest
  static void getConfigReturnsDefaultOrEmpty() {
    Test.startTest();
    Portfolio_Config__mdt config = PortfolioController.getConfig();
    Test.stopTest();
    System.Assert.isNotNull(config, 'getConfig should never return null');
  }

  @IsTest
  static void getExperiencesReturnsOrdered() {
    List<Experience__c> experiences;
    System.runAs(getContentManager()) {
      Test.startTest();
      experiences = PortfolioController.getExperiences();
      Test.stopTest();
    }

    System.Assert.areEqual(2, experiences.size(), 'Both experiences returned');
    System.Assert.areEqual(
      'Acme Corp',
      experiences[0].Name,
      'Lowest sort order comes first'
    );
    System.Assert.isTrue(
      experiences[0].Is_Current__c,
      'Current role flag preserved'
    );
  }

  @IsTest
  static void getProjectsFeaturedIncludesTechAndExcludesUnpublished() {
    List<Project__c> featured;
    System.runAs(getContentManager()) {
      Test.startTest();
      featured = PortfolioController.getProjects('Featured');
      Test.stopTest();
    }

    System.Assert.areEqual(
      1,
      featured.size(),
      'Only the published featured project is returned'
    );
    System.Assert.areEqual('Featured One', featured[0].Name, 'Correct project');
    System.Assert.areEqual(
      2,
      featured[0].Project_Techs__r.size(),
      'Tech tags returned via subquery'
    );
  }

  @IsTest
  static void getProjectsOtherType() {
    List<Project__c> others;
    System.runAs(getContentManager()) {
      Test.startTest();
      others = PortfolioController.getProjects('Other');
      Test.stopTest();
    }

    System.Assert.areEqual(1, others.size(), 'One other project returned');
    System.Assert.areEqual('Other One', others[0].Name, 'Correct project');
  }

  @IsTest
  static void getProjectsBlankTypeDefaultsToFeatured() {
    List<Project__c> defaulted;
    System.runAs(getContentManager()) {
      Test.startTest();
      defaulted = PortfolioController.getProjects(null);
      Test.stopTest();
    }

    System.Assert.areEqual(
      1,
      defaulted.size(),
      'Blank type falls back to Featured'
    );
    System.Assert.areEqual(
      'Featured One',
      defaulted[0].Name,
      'Featured default'
    );
  }
}
