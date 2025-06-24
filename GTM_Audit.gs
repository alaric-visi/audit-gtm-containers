 /* ---------------------------------------------------------------
     1  OAuth2 setup – requires the OAuth2 library above
     --------------------------------------------------------------- */
  
  const CLIENT_ID = 'YOUR_CLIENT_ID';
  const CLIENT_SECRET = 'YOUR_CLIENT_SECRET';
  
  function getService() {
    return OAuth2.createService('GTM')
      .setAuthorizationBaseUrl('https://accounts.google.com/o/oauth2/auth')
      .setTokenUrl('https://oauth2.googleapis.com/token')
      .setClientId(CLIENT_ID)
      .setClientSecret(CLIENT_SECRET)
      .setCallbackFunction('authCallback')
      .setPropertyStore(PropertiesService.getUserProperties())
      .setScope('https://www.googleapis.com/auth/tagmanager.readonly');
  }
  
  function authCallback(request) {
    const service = getService();
    const ok = service.handleCallback(request);
    return HtmlService.createHtmlOutput(
      ok ? 'Authorisation successful. You can close this tab.' : 'Authorisation denied.'
    );
  }
  
  function showSidebar() {
    const service = getService();
    if (!service.hasAccess()) {
      const url = service.getAuthorizationUrl();
      const html = HtmlService.createHtmlOutput(
        '<a href=\"' + url + '\" target=\"_blank\">Click here to authorise</a>'
      );
      SpreadsheetApp.getUi().showSidebar(html);
    } else {
      SpreadsheetApp.getUi().alert('You are already authorised');
    }
  }
  
  /* ---------------------------------------------------------------
     2  GTM helper functions
     --------------------------------------------------------------- */
  
  function listAccounts() {
    const svc = getService();
    const res = UrlFetchApp.fetch(
      'https://www.googleapis.com/tagmanager/v2/accounts',
      {headers:{Authorization:'Bearer ' + svc.getAccessToken()}}
    );
    return (JSON.parse(res).account) || [];
  }
  
  function listContainers(accountId) {
    const svc = getService();
    const res = UrlFetchApp.fetch(
      'https://www.googleapis.com/tagmanager/v2/accounts/' + accountId + '/containers',
      {headers:{Authorization:'Bearer ' + svc.getAccessToken()}}
    );
    return (JSON.parse(res).container) || [];
  }
  
  function listWorkspaceId(accountId, containerId) {
    const svc = getService();
    const res = UrlFetchApp.fetch(
      'https://www.googleapis.com/tagmanager/v2/accounts/' + accountId + '/containers/' + containerId + '/workspaces',
      {headers:{Authorization:'Bearer ' + svc.getAccessToken()}}
    );
    const ws = JSON.parse(res).workspace;
    return ws && ws.length ? ws[0].workspaceId : null;
  }
  
  function listTags(accountId, containerId, workspaceId) {
    const svc = getService();
    const res = UrlFetchApp.fetch(
      'https://www.googleapis.com/tagmanager/v2/accounts/' + accountId + '/containers/' + containerId + '/workspaces/' + workspaceId + '/tags',
      {headers:{Authorization:'Bearer ' + svc.getAccessToken()}}
    );
    return (JSON.parse(res).tag) || [];
  }
  
  function listVariables(accountId, containerId, workspaceId) {
    const svc = getService();
    const res = UrlFetchApp.fetch(
      'https://www.googleapis.com/tagmanager/v2/accounts/' + accountId + '/containers/' + containerId + '/workspaces/' + workspaceId + '/variables',
      {headers:{Authorization:'Bearer ' + svc.getAccessToken()}}
    );
    return (JSON.parse(res).variable) || [];
  }
  
  /* ---------------------------------------------------------------
     3  Write one container’s data to Sheets
     --------------------------------------------------------------- */
  
  function exportGTMConfig(accountId, container) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const workspaceId = listWorkspaceId(accountId, container.containerId);
    if (!workspaceId) return;
  
    /* Tags */
    const tags = listTags(accountId, container.containerId, workspaceId);
    if (tags.length) {
      const tagSheet = ss.getSheetByName('Tags_' + container.publicId)
                   || ss.insertSheet('Tags_' + container.publicId);
      tagSheet.clear();
      tagSheet.appendRow(['Name','Type','Firing Triggers','Blocking Triggers']);
      tags.forEach(t => {
        tagSheet.appendRow([
          t.name,
          t.type,
          (t.firingTriggerId || []).join(', '),
          (t.blockingTriggerId || []).join(', ')
        ]);
      });
    }
  
    /* Variables */
    const vars = listVariables(accountId, container.containerId, workspaceId);
    if (vars.length) {
      const varSheet = ss.getSheetByName('Variables_' + container.publicId)
                    || ss.insertSheet('Variables_' + container.publicId);
      varSheet.clear();
      varSheet.appendRow(['Name','Type']);
      vars.forEach(v => varSheet.appendRow([v.name,v.type]));
    }
  }
  
  /* ---------------------------------------------------------------
     4  Batch exporter – run after authorisation
     --------------------------------------------------------------- */
  
  function exportAllContainers() {
    const accounts = listAccounts();
    accounts.forEach(acc => {
      const containers = listContainers(acc.accountId);
      containers.forEach(c => exportGTMConfig(acc.accountId, c));
    });
    SpreadsheetApp.getUi().alert('All containers exported');
  }
  
