// Lands the Portfolio_Config__mdt "Default" record via the Apex Metadata API.
// The SOAP CustomMetadata deploy path fails in this org (UNKNOWN_EXCEPTION), so
// we enqueue the record here instead. Includes ALL fields — the deployment
// replaces the record's values, so any omitted field would be blanked.

Metadata.CustomMetadata cm = new Metadata.CustomMetadata();
cm.fullName = 'Portfolio_Config.Default';
cm.label = 'Default';

Map<String, Object> fields = new Map<String, Object>{
  'Full_Name__c' => 'Md Mohiuddin',
  'Tagline__c' => 'I build reliable, scalable solutions on the Salesforce platform.',
  'Roles__c' => 'DevOps Engineer|Senior Salesforce Technical Consultant',
  'Intro__c' => 'I\'m a Senior Salesforce Technical Consultant and DevOps engineer who builds reliable, scalable solutions on the Salesforce platform. I turn complex business needs into clean, thoughtfully designed experiences — and ship them with confidence through automated, dependable delivery.',
  'Email__c' => 'themdmohiuddin@gmail.com',
  'Notification_Email__c' => 'themdmohiuddin@gmail.com',
  'GitHub_URL__c' => 'https://github.com/devmdmohiuddin',
  'LinkedIn_URL__c' => 'https://www.linkedin.com/in/themdmohiuddin/',
  'Resume_URL__c' => 'https://themdmohiuddin-dev-ed.develop.my.site.com/me/sfsites/c/resource/portfolioResume',
  'Photo_URL__c' => 'https://themdmohiuddin-dev-ed.develop.my.site.com/me/sfsites/c/resource/portfolioPhoto',
  'About__c' => 'Hello! My name is Mohi and I enjoy building things that live on the web — mostly on the Salesforce platform. My interest in development started with customizing business apps, which quickly turned into a passion for crafting the polished, animated experiences that sit on top of them.\n\nFast-forward to today, I\'ve had the privilege of building data-driven Experience Cloud sites, Lightning Web Components, and Apex services where content lives in records — so the people who own the words never have to wait on a deploy.\n\nHere are a few technologies I\'ve been working with recently:',
  'Tech_List__c' => 'Apex\nLightning Web Components\nJavaScript (ES6+)\nSOQL & SOSL\nExperience Cloud (LWR)\nSalesforce Flow',
  'Availability_Message__c' => 'I\'m currently open to new opportunities and my inbox is always open. Whether you have a question or just want to say hi, I\'ll do my best to get back to you.'
};

for (String fieldName : fields.keySet()) {
  Metadata.CustomMetadataValue v = new Metadata.CustomMetadataValue();
  v.field = fieldName;
  v.value = fields.get(fieldName);
  cm.values.add(v);
}

Metadata.DeployContainer container = new Metadata.DeployContainer();
container.addMetadata(cm);
Id jobId = Metadata.Operations.enqueueDeployment(container, null);
System.debug('Enqueued Portfolio_Config update, jobId=' + jobId);
