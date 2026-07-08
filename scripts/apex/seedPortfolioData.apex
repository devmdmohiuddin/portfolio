/**
 * Seeds sample portfolio content: experiences, projects, and tech tags.
 *
 * Idempotent — clears existing sample records first, so it is safe to re-run.
 * Run with:
 *   sf apex run --file scripts/apex/seedPortfolioData.apex -o personal-dev-org
 *
 * The Portfolio_Config__mdt "Default" record ships as metadata (deploy), so it
 * is not seeded here.
 */

// --- Clean slate (Project_Tech__c cascades via master-detail on Project__c) ---
delete [SELECT Id FROM Experience__c];
delete [SELECT Id FROM Project__c];

// --- Experiences (2-3) ---
List<Experience__c> experiences = new List<Experience__c>{
  new Experience__c(
    Name = 'Salesforce',
    Role__c = 'Senior Platform Developer',
    Company_URL__c = 'https://www.salesforce.com',
    Start_Date__c = Date.newInstance(2023, 3, 1),
    Is_Current__c = true,
    Sort_Order__c = 1,
    Highlights__c = 'Built data-driven Experience Cloud sites with LWC and Apex.\n' +
      'Drove accessibility and performance to Lighthouse 90+.\n' +
      'Mentored developers on clean, testable architecture.'
  ),
  new Experience__c(
    Name = 'Acme Digital',
    Role__c = 'Salesforce Developer',
    Company_URL__c = 'https://example.com',
    Start_Date__c = Date.newInstance(2021, 1, 1),
    End_Date__c = Date.newInstance(2023, 2, 28),
    Is_Current__c = false,
    Sort_Order__c = 2,
    Highlights__c = 'Delivered custom LWC components and Apex services.\n' +
      'Integrated third-party APIs via named credentials.\n' +
      'Raised org-wide test coverage above 90%.'
  ),
  new Experience__c(
    Name = 'Globex',
    Role__c = 'Junior Developer',
    Company_URL__c = 'https://example.org',
    Start_Date__c = Date.newInstance(2019, 6, 1),
    End_Date__c = Date.newInstance(2020, 12, 31),
    Is_Current__c = false,
    Sort_Order__c = 3,
    Highlights__c = 'Automated business processes with Flow and Apex triggers.\n' +
      'Built reports and dashboards for stakeholders.'
  )
};
insert experiences;

// --- Projects (4-6): mix of Featured, Other, and archived ---
List<Project__c> projects = new List<Project__c>{
  new Project__c(
    Name = 'Portfolio Experience Site',
    Description__c = 'A fully data-driven portfolio on Salesforce Experience Cloud (LWR). ' +
      'Every section renders from records and custom metadata.',
    Type__c = 'Featured',
    Sort_Order__c = 1,
    GitHub_URL__c = 'https://github.com/devmdmohiuddin',
    External_URL__c = 'https://www.linkedin.com/in/themdmohiuddin/',
    Image_URL__c = 'https://themdmohiuddin-dev-ed.develop.my.site.com/me/sfsites/c/resource/portfolioProjectSite',
    Is_Published__c = true,
    Show_In_Archive__c = false
  ),
  new Project__c(
    Name = 'Motion Toolkit for LWC',
    Description__c = 'A reusable scroll-reveal and staggered-entrance toolkit for LWR ' +
      'sites, built on a shared IntersectionObserver and reduced-motion aware.',
    Type__c = 'Featured',
    Sort_Order__c = 2,
    GitHub_URL__c = 'https://github.com/devmdmohiuddin',
    Image_URL__c = 'https://themdmohiuddin-dev-ed.develop.my.site.com/me/sfsites/c/resource/portfolioProjectMotion',
    Is_Published__c = true,
    Show_In_Archive__c = false
  ),
  new Project__c(
    Name = 'Apex Data Seeder',
    Description__c = 'Idempotent anonymous-Apex utilities for seeding demo orgs.',
    Type__c = 'Other',
    Sort_Order__c = 1,
    GitHub_URL__c = 'https://github.com/devmdmohiuddin',
    Is_Published__c = true,
    Show_In_Archive__c = false
  ),
  new Project__c(
    Name = 'Design Token System',
    Description__c = 'CSS custom-property design tokens powering a dark/light theme.',
    Type__c = 'Other',
    Sort_Order__c = 2,
    External_URL__c = 'https://example.com/design-tokens',
    Is_Published__c = true,
    Show_In_Archive__c = false
  ),
  new Project__c(
    Name = 'Legacy VF Dashboard',
    Description__c = 'An early Visualforce reporting dashboard, kept for the archive.',
    Type__c = 'Other',
    Sort_Order__c = 3,
    Is_Published__c = true,
    Show_In_Archive__c = true
  ),
  new Project__c(
    Name = 'Trigger Framework Demo',
    Description__c = 'A lightweight, testable Apex trigger handler pattern.',
    Type__c = 'Other',
    Sort_Order__c = 4,
    GitHub_URL__c = 'https://github.com/devmdmohiuddin',
    Is_Published__c = true,
    Show_In_Archive__c = true
  )
};
insert projects;

// --- Tech tags per project ---
Map<String, List<String>> techByProject = new Map<String, List<String>>{
  'Portfolio Experience Site' => new List<String>{
    'LWC',
    'Apex',
    'Experience Cloud',
    'CSS'
  },
  'Motion Toolkit for LWC' => new List<String>{ 'LWC', 'JavaScript', 'CSS' },
  'Apex Data Seeder' => new List<String>{ 'Apex' },
  'Design Token System' => new List<String>{ 'CSS', 'Design Tokens' },
  'Legacy VF Dashboard' => new List<String>{ 'Visualforce', 'SOQL' },
  'Trigger Framework Demo' => new List<String>{ 'Apex' }
};

Map<String, Id> projectIdByName = new Map<String, Id>();
for (Project__c p : projects) {
  projectIdByName.put(p.Name, p.Id);
}

List<Project_Tech__c> techs = new List<Project_Tech__c>();
for (String projectName : techByProject.keySet()) {
  for (String tech : techByProject.get(projectName)) {
    techs.add(
      new Project_Tech__c(
        Name = tech,
        Project__c = projectIdByName.get(projectName)
      )
    );
  }
}
insert techs;

System.debug(
  'Seeded ' +
    experiences.size() +
    ' experiences, ' +
    projects.size() +
    ' projects, ' +
    techs.size() +
    ' tech tags.'
);
