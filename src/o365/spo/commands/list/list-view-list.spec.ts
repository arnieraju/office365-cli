import commands from '../../commands';
import Command, { CommandValidate, CommandError, CommandOption } from '../../../../Command';
import * as sinon from 'sinon';
import appInsights from '../../../../appInsights';
import auth, { Site } from '../../SpoAuth';
const command: Command = require('./list-view-list');
import * as assert from 'assert';
import request from '../../../../request';
import Utils from '../../../../Utils';

describe(commands.LIST_VIEW_LIST, () => {
  let vorpal: Vorpal;
  let log: any[];
  let cmdInstance: any;
  let cmdInstanceLogSpy: sinon.SinonSpy;
  let trackEvent: any;
  let telemetry: any;

  before(() => {
    sinon.stub(auth, 'restoreAuth').callsFake(() => Promise.resolve());
    sinon.stub(auth, 'getAccessToken').callsFake(() => { return Promise.resolve('ABC'); });
    sinon.stub(command as any, 'getRequestDigestForSite').callsFake(() => Promise.resolve({ FormDigestValue: 'ABC' }));
    trackEvent = sinon.stub(appInsights, 'trackEvent').callsFake((t) => {
      telemetry = t;
    });
  });

  beforeEach(() => {
    vorpal = require('../../../../vorpal-init');
    log = [];
    cmdInstance = {
      log: (msg: string) => {
        log.push(msg);
      }
    };
    cmdInstanceLogSpy = sinon.spy(cmdInstance, 'log');
    auth.site = new Site();
    telemetry = null;
  });

  afterEach(() => {
    Utils.restore([
      vorpal.find,
      request.get,
      request.post
    ]);
  });

  after(() => {
    Utils.restore([
      appInsights.trackEvent,
      auth.getAccessToken,
      auth.restoreAuth,
      request.get,
      request.post
    ]);
  });

  it('has correct name', () => {
    assert.equal(command.name.startsWith(commands.LIST_VIEW_LIST), true);
  });

  it('has a description', () => {
    assert.notEqual(command.description, null);
  });

  it('calls telemetry', (done) => {
    cmdInstance.action = command.action();
    cmdInstance.action({ options: {} }, () => {
      try {
        assert(trackEvent.called);
        done();
      }
      catch (e) {
        done(e);
      }
    });
  });

  it('logs correct telemetry event', (done) => {
    cmdInstance.action = command.action();
    cmdInstance.action({ options: {} }, () => {
      try {
        assert.equal(telemetry.name, commands.LIST_VIEW_LIST);
        done();
      }
      catch (e) {
        done(e);
      }
    });
  });

  it('aborts when not connected to a SharePoint site', (done) => {
    auth.site = new Site();
    auth.site.connected = false;
    cmdInstance.action = command.action();
    cmdInstance.action({ options: { debug: false, webUrl: 'https://contoso.sharepoint.com/sites/ninja', title: 'Documents' } }, (err?: any) => {
      try {
        assert.equal(JSON.stringify(err), JSON.stringify(new CommandError('Log in to a SharePoint Online site first')));
        done();
      }
      catch (e) {
        done(e);
      }
    });
  });

  it('retrieves all views of the specific list if listTitle option is passed (debug)', (done) => {
    sinon.stub(request, 'get').callsFake((opts) => {
      if (opts.url.indexOf(`https://contoso.sharepoint.com/sites/ninja/_api/web/lists/GetByTitle(\'Documents\')/views`) > -1) {
        if (opts.headers.authorization &&
          opts.headers.authorization.indexOf('Bearer ') === 0 &&
          opts.headers.accept &&
          opts.headers.accept.indexOf('application/json') === 0) {
          return Promise.resolve({
            "value": [{ "Aggregations": null, "AggregationsStatus": null, "BaseViewId": "1", "ColumnWidth": null, "ContentTypeId": { "StringValue": "0x" }, "CustomFormatter": null, "DefaultView": true, "DefaultViewForContentType": false, "EditorModified": false, "Formats": null, "Hidden": false, "HtmlSchemaXml": "<View Name=\"{85907FB0-CDA1-43EC-832E-27118C89CF9F}\" DefaultView=\"TRUE\" MobileView=\"TRUE\" MobileDefaultView=\"TRUE\" Type=\"HTML\" DisplayName=\"All Documents\" Url=\"/sites/ninja/Shared Documents/Forms/AllItems.aspx\" Level=\"1\" BaseViewID=\"1\" ContentTypeID=\"0x\" ImageUrl=\"/_layouts/15/images/dlicon.png?rev=45\"><XslLink Default=\"TRUE\">main.xsl</XslLink><JSLink>clienttemplates.js</JSLink><RowLimit Paged=\"TRUE\">30</RowLimit><Toolbar Type=\"Standard\" /><ViewFields><FieldRef Name=\"DocIcon\" /><FieldRef Name=\"LinkFilename\" /><FieldRef Name=\"Modified\" /><FieldRef Name=\"Editor\" /></ViewFields><ParameterBindings><ParameterBinding Name=\"NoAnnouncements\" Location=\"Resource(wss,noitemsinview_doclibrary)\" /><ParameterBinding Name=\"NoAnnouncementsHowTo\" Location=\"Resource(wss,noitemsinview_doclibrary_howto2)\" /></ParameterBindings><Query><OrderBy><FieldRef Name=\"FileLeafRef\" /></OrderBy></Query></View>", "Id": "85907fb0-cda1-43ec-832e-27118c89cf9f", "ImageUrl": "/_layouts/15/images/dlicon.png?rev=45", "IncludeRootFolder": false, "ViewJoins": null, "JSLink": "clienttemplates.js", "ListViewXml": "<View Name=\"{85907FB0-CDA1-43EC-832E-27118C89CF9F}\" DefaultView=\"TRUE\" MobileView=\"TRUE\" MobileDefaultView=\"TRUE\" Type=\"HTML\" DisplayName=\"All Documents\" Url=\"/sites/ninja/Shared Documents/Forms/AllItems.aspx\" Level=\"1\" BaseViewID=\"1\" ContentTypeID=\"0x\" ImageUrl=\"/_layouts/15/images/dlicon.png?rev=45\" ><Query><OrderBy><FieldRef Name=\"FileLeafRef\" /></OrderBy></Query><ViewFields><FieldRef Name=\"DocIcon\" /><FieldRef Name=\"LinkFilename\" /><FieldRef Name=\"Modified\" /><FieldRef Name=\"Editor\" /></ViewFields><RowLimit Paged=\"TRUE\">30</RowLimit><JSLink>clienttemplates.js</JSLink><XslLink Default=\"TRUE\">main.xsl</XslLink><Toolbar Type=\"Standard\"/></View>", "Method": null, "MobileDefaultView": true, "MobileView": true, "ModerationType": null, "NewDocumentTemplates": null, "OrderedView": false, "Paged": true, "PersonalView": false, "ViewProjectedFields": null, "ViewQuery": "<OrderBy><FieldRef Name=\"FileLeafRef\" /></OrderBy>", "ReadOnlyView": false, "RequiresClientIntegration": false, "RowLimit": 30, "Scope": 0, "ServerRelativePath": { "DecodedUrl": "/sites/ninja/Shared Documents/Forms/AllItems.aspx" }, "ServerRelativeUrl": "/sites/ninja/Shared Documents/Forms/AllItems.aspx", "StyleId": null, "TabularView": true, "Threaded": false, "Title": "All Documents", "Toolbar": "", "ToolbarTemplateName": null, "ViewType": "HTML", "ViewData": null, "VisualizationInfo": null }, { "Aggregations": null, "AggregationsStatus": null, "BaseViewId": "9", "ColumnWidth": null, "ContentTypeId": { "StringValue": "0x" }, "CustomFormatter": null, "DefaultView": false, "DefaultViewForContentType": false, "EditorModified": false, "Formats": null, "Hidden": true, "HtmlSchemaXml": "<View Name=\"{281E80FD-099B-4EBA-B622-A94FA03BF865}\" Type=\"HTML\" Hidden=\"TRUE\" TabularView=\"FALSE\" DisplayName=\"Relink Documents\" Url=\"/sites/ninja/Shared Documents/Forms/repair.aspx\" Level=\"1\" BaseViewID=\"9\" ContentTypeID=\"0x\" ToolbarTemplate=\"RelinkToolBar\" ImageUrl=\"/_layouts/15/images/dlicon.png?rev=45\"><XslLink Default=\"TRUE\">main.xsl</XslLink><RowLimit Paged=\"TRUE\">30</RowLimit><Toolbar Type=\"Standard\" /><ViewFields><FieldRef Name=\"DocIcon\" /><FieldRef Name=\"LinkFilenameNoMenu\" /><FieldRef Name=\"RepairDocument\" /><FieldRef Name=\"Modified\" /><FieldRef Name=\"Editor\" /><FieldRef Name=\"ContentType\" /><FieldRef Name=\"TemplateUrl\" /></ViewFields><ParameterBindings><ParameterBinding Name=\"NoAnnouncements\" Location=\"Resource(wss,noitemsinview_doclibrary)\" /><ParameterBinding Name=\"NoAnnouncementsHowTo\" Location=\"Resource(wss,noitemsinview_doclibrary_howto2)\" /></ParameterBindings><Query><OrderBy><FieldRef Name=\"FileLeafRef\" /></OrderBy><Where><Neq><FieldRef Name=\"xd_Signature\" /><Value Type=\"Boolean\">1</Value></Neq></Where></Query></View>", "Id": "281e80fd-099b-4eba-b622-a94fa03bf865", "ImageUrl": "/_layouts/15/images/dlicon.png?rev=45", "IncludeRootFolder": false, "ViewJoins": null, "JSLink": null, "ListViewXml": "<View Name=\"{281E80FD-099B-4EBA-B622-A94FA03BF865}\" Type=\"HTML\" Hidden=\"TRUE\" TabularView=\"FALSE\" DisplayName=\"Relink Documents\" Url=\"/sites/ninja/Shared Documents/Forms/repair.aspx\" Level=\"1\" BaseViewID=\"9\" ContentTypeID=\"0x\" ToolbarTemplate=\"RelinkToolBar\" ImageUrl=\"/_layouts/15/images/dlicon.png?rev=45\" ><Query><OrderBy><FieldRef Name=\"FileLeafRef\" /></OrderBy><Where><Neq><FieldRef Name=\"xd_Signature\" /><Value Type=\"Boolean\">1</Value></Neq></Where></Query><ViewFields><FieldRef Name=\"DocIcon\" /><FieldRef Name=\"LinkFilenameNoMenu\" /><FieldRef Name=\"RepairDocument\" /><FieldRef Name=\"Modified\" /><FieldRef Name=\"Editor\"/><FieldRef Name=\"ContentType\" /><FieldRef Name=\"TemplateUrl\" /></ViewFields><RowLimit Paged=\"TRUE\">30</RowLimit><XslLink Default=\"TRUE\">main.xsl</XslLink><Toolbar Type=\"Standard\"/></View>", "Method": null, "MobileDefaultView": false, "MobileView": false, "ModerationType": null, "NewDocumentTemplates": null, "OrderedView": false, "Paged": true, "PersonalView": false, "ViewProjectedFields": null, "ViewQuery": "<OrderBy><FieldRef Name=\"FileLeafRef\" /></OrderBy><Where><Neq><FieldRef Name=\"xd_Signature\" /><Value Type=\"Boolean\">1</Value></Neq></Where>", "ReadOnlyView": false, "RequiresClientIntegration": false, "RowLimit": 30, "Scope": 0, "ServerRelativePath": { "DecodedUrl": "/sites/ninja/Shared Documents/Forms/repair.aspx" }, "ServerRelativeUrl": "/sites/ninja/Shared Documents/Forms/repair.aspx", "StyleId": null, "TabularView": false, "Threaded": false, "Title": "Relink Documents", "Toolbar": "", "ToolbarTemplateName": "RelinkToolBar", "ViewType": "HTML", "ViewData": null, "VisualizationInfo": null }, { "Aggregations": null, "AggregationsStatus": null, "BaseViewId": "40", "ColumnWidth": null, "ContentTypeId": { "StringValue": "0x" }, "CustomFormatter": null, "DefaultView": false, "DefaultViewForContentType": false, "EditorModified": false, "Formats": null, "Hidden": true, "HtmlSchemaXml": "<View Name=\"{3D760127-982C-405E-9C93-E1F76E1A1110}\" Type=\"HTML\" Hidden=\"TRUE\" DisplayName=\"assetLibTemp\" Url=\"/sites/ninja/Shared Documents/Forms/Thumbnails.aspx\" Level=\"1\" BaseViewID=\"40\" ContentTypeID=\"0x\" ImageUrl=\"/_layouts/15/images/dlicon.png?rev=45\"><ViewFields><FieldRef Name=\"LinkFilename\" /></ViewFields><RowLimit>20</RowLimit><Query><OrderBy><FieldRef Name=\"LinkFilename\" /></OrderBy></Query></View>", "Id": "3d760127-982c-405e-9c93-e1f76e1a1110", "ImageUrl": "/_layouts/15/images/dlicon.png?rev=45", "IncludeRootFolder": false, "ViewJoins": null, "JSLink": null, "ListViewXml": "<View Name=\"{3D760127-982C-405E-9C93-E1F76E1A1110}\" Type=\"HTML\" Hidden=\"TRUE\" DisplayName=\"assetLibTemp\" Url=\"/sites/ninja/SharedDocuments/Forms/Thumbnails.aspx\" Level=\"1\" BaseViewID=\"40\" ContentTypeID=\"0x\" ImageUrl=\"/_layouts/15/images/dlicon.png?rev=45\" ><Query><OrderBy><FieldRef Name=\"LinkFilename\" /></OrderBy></Query><ViewFields><FieldRef Name=\"LinkFilename\" /></ViewFields><RowLimit>20</RowLimit><Toolbar Type=\"None\"/></View>", "Method": null, "MobileDefaultView": false, "MobileView": false, "ModerationType": null, "NewDocumentTemplates": null, "OrderedView": false, "Paged": false, "PersonalView": false, "ViewProjectedFields": null, "ViewQuery": "<OrderBy><FieldRef Name=\"LinkFilename\" /></OrderBy>", "ReadOnlyView": false, "RequiresClientIntegration": false, "RowLimit": 20, "Scope": 0, "ServerRelativePath": { "DecodedUrl": "/sites/ninja/Shared Documents/Forms/Thumbnails.aspx" }, "ServerRelativeUrl": "/sites/ninja/Shared Documents/Forms/Thumbnails.aspx", "StyleId": null, "TabularView": true, "Threaded": false, "Title": "assetLibTemp", "Toolbar": null, "ToolbarTemplateName": null, "ViewType": "HTML", "ViewData": null, "VisualizationInfo": null }, { "Aggregations": null, "AggregationsStatus": null, "BaseViewId": "7", "ColumnWidth": null, "ContentTypeId": { "StringValue": "0x" }, "CustomFormatter": null, "DefaultView": false, "DefaultViewForContentType": false, "EditorModified": false, "Formats": null, "Hidden": true, "HtmlSchemaXml": "<View Name=\"{1204C10A-978D-46C8-A6F2-65ECFA5E03D5}\" Type=\"HTML\" Hidden=\"TRUE\" TabularView=\"FALSE\" AggregateView=\"TRUE\" DisplayName=\"Merge Documents\" Url=\"/sites/ninja/Shared Documents/Forms/Combine.aspx\" Level=\"1\" BaseViewID=\"7\" ContentTypeID=\"0x\" ToolbarTemplate=\"MergeToolBar\" ImageUrl=\"/_layouts/15/images/dlicon.png?rev=45\"><XslLink Default=\"TRUE\">main.xsl</XslLink><JSLink>clienttemplates.js</JSLink><RowLimit Paged=\"TRUE\">30</RowLimit><Toolbar Type=\"Standard\" /><ViewFields><FieldRef Name=\"DocIcon\" /><FieldRef Name=\"LinkFilename\" /><FieldRef Name=\"Combine\" /><FieldRef Name=\"Modified\" /><FieldRef Name=\"Editor\" /></ViewFields><ParameterBindings><ParameterBinding Name=\"NoAnnouncements\" Location=\"Resource(wss,noitemsinview_doclibrary)\" /><ParameterBinding Name=\"NoAnnouncementsHowTo\" Location=\"Resource(wss,noitemsinview_doclibrary_howto2)\" /></ParameterBindings><Query><OrderBy><FieldRef Name=\"FileLeafRef\" /></OrderBy></Query></View>", "Id": "1204c10a-978d-46c8-a6f2-65ecfa5e03d5", "ImageUrl": "/_layouts/15/images/dlicon.png?rev=45", "IncludeRootFolder": false, "ViewJoins": null, "JSLink": "clienttemplates.js", "ListViewXml": "<View Name=\"{1204C10A-978D-46C8-A6F2-65ECFA5E03D5}\" Type=\"HTML\" Hidden=\"TRUE\" TabularView=\"FALSE\" AggregateView=\"TRUE\" DisplayName=\"Merge Documents\" Url=\"/sites/ninja/Shared Documents/Forms/Combine.aspx\" Level=\"1\" BaseViewID=\"7\" ContentTypeID=\"0x\" ToolbarTemplate=\"MergeToolBar\" ImageUrl=\"/_layouts/15/images/dlicon.png?rev=45\" ><Query><OrderBy><FieldRef Name=\"FileLeafRef\" /></OrderBy></Query><ViewFields><FieldRef Name=\"DocIcon\" /><FieldRef Name=\"LinkFilename\" /><FieldRef Name=\"Combine\" /><FieldRef Name=\"Modified\" /><FieldRef Name=\"Editor\" /></ViewFields><RowLimit Paged=\"TRUE\">30</RowLimit><JSLink>clienttemplates.js</JSLink><XslLink Default=\"TRUE\">main.xsl</XslLink><Toolbar Type=\"Standard\"/></View>", "Method": null, "MobileDefaultView": false, "MobileView": false, "ModerationType": null, "NewDocumentTemplates": null, "OrderedView": false, "Paged": true, "PersonalView": false, "ViewProjectedFields": null, "ViewQuery": "<OrderBy><FieldRef Name=\"FileLeafRef\" /></OrderBy>", "ReadOnlyView": false, "RequiresClientIntegration": false, "RowLimit": 30, "Scope": 0, "ServerRelativePath": { "DecodedUrl": "/sites/ninja/Shared Documents/Forms/Combine.aspx" }, "ServerRelativeUrl": "/sites/ninja/Shared Documents/Forms/Combine.aspx", "StyleId": null, "TabularView": false, "Threaded": false, "Title": "Merge Documents", "Toolbar": "", "ToolbarTemplateName": "MergeToolBar", "ViewType": "HTML", "ViewData": null, "VisualizationInfo": null }, { "Aggregations": null, "AggregationsStatus": null, "BaseViewId": "50", "ColumnWidth": null, "ContentTypeId": { "StringValue": "0x" }, "CustomFormatter": null, "DefaultView": false, "DefaultViewForContentType": false, "EditorModified": false, "Formats": null, "Hidden": true, "HtmlSchemaXml": "<View Name=\"{E021E923-0801-4A16-9775-545239356739}\" MobileView=\"TRUE\" Type=\"HTML\" Hidden=\"TRUE\" DisplayName=\"\" Url=\"/sites/ninja/SitePages/Home.aspx\" Level=\"1\" BaseViewID=\"50\" ContentTypeID=\"0x\"><XslLink Default=\"TRUE\">main.xsl</XslLink><JSLink>clienttemplates.js</JSLink><RowLimit Paged=\"TRUE\">15</RowLimit><Toolbar Type=\"Standard\" /><ViewFields><FieldRef Name=\"DocIcon\" /><FieldRef Name=\"LinkFilename\" /></ViewFields><ParameterBindings><ParameterBinding Name=\"NoAnnouncements\" Location=\"Resource(wss,noitemsinview_doclibrary)\" /><ParameterBinding Name=\"NoAnnouncementsHowTo\" Location=\"Resource(wss,noitemsinview_doclibrary_howto2)\" /></ParameterBindings><Query><OrderBy><FieldRef Name=\"Modified\" Ascending=\"FALSE\" /></OrderBy></Query></View>", "Id": "e021e923-0801-4a16-9775-545239356739", "ImageUrl": null, "IncludeRootFolder": false, "ViewJoins": null, "JSLink": "clienttemplates.js", "ListViewXml": "<View Name=\"{E021E923-0801-4A16-9775-545239356739}\" MobileView=\"TRUE\" Type=\"HTML\"Hidden=\"TRUE\" DisplayName=\"\" Url=\"/sites/ninja/SitePages/Home.aspx\" Level=\"1\" BaseViewID=\"50\" ContentTypeID=\"0x\" ><Query><OrderBy><FieldRef Name=\"Modified\" Ascending=\"FALSE\" /></OrderBy></Query><ViewFields><FieldRef Name=\"DocIcon\" /><FieldRef Name=\"LinkFilename\" /></ViewFields><RowLimit Paged=\"TRUE\">15</RowLimit><JSLink>clienttemplates.js</JSLink><XslLink Default=\"TRUE\">main.xsl</XslLink><Toolbar Type=\"Standard\"/></View>", "Method": null, "MobileDefaultView": false, "MobileView": true, "ModerationType": null, "NewDocumentTemplates": null, "OrderedView": false, "Paged": true, "PersonalView": false, "ViewProjectedFields": null, "ViewQuery": "<OrderBy><FieldRef Name=\"Modified\" Ascending=\"FALSE\" /></OrderBy>", "ReadOnlyView": false, "RequiresClientIntegration": false, "RowLimit": 15, "Scope": 0, "ServerRelativePath": { "DecodedUrl": "/sites/ninja/SitePages/Home.aspx" }, "ServerRelativeUrl": "/sites/ninja/SitePages/Home.aspx", "StyleId": null, "TabularView": true, "Threaded": false, "Title": "", "Toolbar": "", "ToolbarTemplateName": null, "ViewType": "HTML", "ViewData": null, "VisualizationInfo": null }]
          });
        }
      }

      return Promise.reject('Invalid request');
    });

    auth.site = new Site();
    auth.site.connected = true;
    auth.site.url = 'https://contoso-admin.sharepoint.com';
    auth.site.tenantId = 'abc';
    cmdInstance.action = command.action();
    cmdInstance.action({
      options: {
        debug: true,
        listTitle: 'Documents',
        webUrl: 'https://contoso.sharepoint.com/sites/ninja'
      }
    }, () => {
      try {
        assert(cmdInstanceLogSpy.calledWith([
          {
            "Id": "85907fb0-cda1-43ec-832e-27118c89cf9f",
            "Title": "All Documents",
            "DefaultView": true,
            "Hidden": false,
            "BaseViewId": "1"
          },
          {
            "Id": "281e80fd-099b-4eba-b622-a94fa03bf865",
            "Title": "Relink Documents",
            "DefaultView": false,
            "Hidden": true,
            "BaseViewId": "9"
          },
          {
            "Id": "3d760127-982c-405e-9c93-e1f76e1a1110",
            "Title": "assetLibTemp",
            "DefaultView": false,
            "Hidden": true,
            "BaseViewId": "40"
          },
          {
            "Id": "1204c10a-978d-46c8-a6f2-65ecfa5e03d5",
            "Title": "Merge Documents",
            "DefaultView": false,
            "Hidden": true,
            "BaseViewId": "7"
          },
          {
            "Id": "e021e923-0801-4a16-9775-545239356739",
            "Title": "",
            "DefaultView": false,
            "Hidden": true,
            "BaseViewId": "50"
          }
        ]));
        done();
      }
      catch (e) {
        done(e);
      }
    });
  });

  it('retrieves all views of the specific list if listTitle option is passed', (done) => {
    sinon.stub(request, 'get').callsFake((opts) => {
      if (opts.url.indexOf(`https://contoso.sharepoint.com/sites/ninja/_api/web/lists/GetByTitle('Documents')/views`) > -1) {
        if (opts.headers.authorization &&
          opts.headers.authorization.indexOf('Bearer ') === 0 &&
          opts.headers.accept &&
          opts.headers.accept.indexOf('application/json') === 0) {
          return Promise.resolve({
            "value": [{ "Aggregations": null, "AggregationsStatus": null, "BaseViewId": "1", "ColumnWidth": null, "ContentTypeId": { "StringValue": "0x" }, "CustomFormatter": null, "DefaultView": true, "DefaultViewForContentType": false, "EditorModified": false, "Formats": null, "Hidden": false, "HtmlSchemaXml": "<View Name=\"{85907FB0-CDA1-43EC-832E-27118C89CF9F}\" DefaultView=\"TRUE\" MobileView=\"TRUE\" MobileDefaultView=\"TRUE\" Type=\"HTML\" DisplayName=\"All Documents\" Url=\"/sites/ninja/Shared Documents/Forms/AllItems.aspx\" Level=\"1\" BaseViewID=\"1\" ContentTypeID=\"0x\" ImageUrl=\"/_layouts/15/images/dlicon.png?rev=45\"><XslLink Default=\"TRUE\">main.xsl</XslLink><JSLink>clienttemplates.js</JSLink><RowLimit Paged=\"TRUE\">30</RowLimit><Toolbar Type=\"Standard\" /><ViewFields><FieldRef Name=\"DocIcon\" /><FieldRef Name=\"LinkFilename\" /><FieldRef Name=\"Modified\" /><FieldRef Name=\"Editor\" /></ViewFields><ParameterBindings><ParameterBinding Name=\"NoAnnouncements\" Location=\"Resource(wss,noitemsinview_doclibrary)\" /><ParameterBinding Name=\"NoAnnouncementsHowTo\" Location=\"Resource(wss,noitemsinview_doclibrary_howto2)\" /></ParameterBindings><Query><OrderBy><FieldRef Name=\"FileLeafRef\" /></OrderBy></Query></View>", "Id": "85907fb0-cda1-43ec-832e-27118c89cf9f", "ImageUrl": "/_layouts/15/images/dlicon.png?rev=45", "IncludeRootFolder": false, "ViewJoins": null, "JSLink": "clienttemplates.js", "ListViewXml": "<View Name=\"{85907FB0-CDA1-43EC-832E-27118C89CF9F}\" DefaultView=\"TRUE\" MobileView=\"TRUE\" MobileDefaultView=\"TRUE\" Type=\"HTML\" DisplayName=\"All Documents\" Url=\"/sites/ninja/Shared Documents/Forms/AllItems.aspx\" Level=\"1\" BaseViewID=\"1\" ContentTypeID=\"0x\" ImageUrl=\"/_layouts/15/images/dlicon.png?rev=45\" ><Query><OrderBy><FieldRef Name=\"FileLeafRef\" /></OrderBy></Query><ViewFields><FieldRef Name=\"DocIcon\" /><FieldRef Name=\"LinkFilename\" /><FieldRef Name=\"Modified\" /><FieldRef Name=\"Editor\" /></ViewFields><RowLimit Paged=\"TRUE\">30</RowLimit><JSLink>clienttemplates.js</JSLink><XslLink Default=\"TRUE\">main.xsl</XslLink><Toolbar Type=\"Standard\"/></View>", "Method": null, "MobileDefaultView": true, "MobileView": true, "ModerationType": null, "NewDocumentTemplates": null, "OrderedView": false, "Paged": true, "PersonalView": false, "ViewProjectedFields": null, "ViewQuery": "<OrderBy><FieldRef Name=\"FileLeafRef\" /></OrderBy>", "ReadOnlyView": false, "RequiresClientIntegration": false, "RowLimit": 30, "Scope": 0, "ServerRelativePath": { "DecodedUrl": "/sites/ninja/Shared Documents/Forms/AllItems.aspx" }, "ServerRelativeUrl": "/sites/ninja/Shared Documents/Forms/AllItems.aspx", "StyleId": null, "TabularView": true, "Threaded": false, "Title": "All Documents", "Toolbar": "", "ToolbarTemplateName": null, "ViewType": "HTML", "ViewData": null, "VisualizationInfo": null }, { "Aggregations": null, "AggregationsStatus": null, "BaseViewId": "9", "ColumnWidth": null, "ContentTypeId": { "StringValue": "0x" }, "CustomFormatter": null, "DefaultView": false, "DefaultViewForContentType": false, "EditorModified": false, "Formats": null, "Hidden": true, "HtmlSchemaXml": "<View Name=\"{281E80FD-099B-4EBA-B622-A94FA03BF865}\" Type=\"HTML\" Hidden=\"TRUE\" TabularView=\"FALSE\" DisplayName=\"Relink Documents\" Url=\"/sites/ninja/Shared Documents/Forms/repair.aspx\" Level=\"1\" BaseViewID=\"9\" ContentTypeID=\"0x\" ToolbarTemplate=\"RelinkToolBar\" ImageUrl=\"/_layouts/15/images/dlicon.png?rev=45\"><XslLink Default=\"TRUE\">main.xsl</XslLink><RowLimit Paged=\"TRUE\">30</RowLimit><Toolbar Type=\"Standard\" /><ViewFields><FieldRef Name=\"DocIcon\" /><FieldRef Name=\"LinkFilenameNoMenu\" /><FieldRef Name=\"RepairDocument\" /><FieldRef Name=\"Modified\" /><FieldRef Name=\"Editor\" /><FieldRef Name=\"ContentType\" /><FieldRef Name=\"TemplateUrl\" /></ViewFields><ParameterBindings><ParameterBinding Name=\"NoAnnouncements\" Location=\"Resource(wss,noitemsinview_doclibrary)\" /><ParameterBinding Name=\"NoAnnouncementsHowTo\" Location=\"Resource(wss,noitemsinview_doclibrary_howto2)\" /></ParameterBindings><Query><OrderBy><FieldRef Name=\"FileLeafRef\" /></OrderBy><Where><Neq><FieldRef Name=\"xd_Signature\" /><Value Type=\"Boolean\">1</Value></Neq></Where></Query></View>", "Id": "281e80fd-099b-4eba-b622-a94fa03bf865", "ImageUrl": "/_layouts/15/images/dlicon.png?rev=45", "IncludeRootFolder": false, "ViewJoins": null, "JSLink": null, "ListViewXml": "<View Name=\"{281E80FD-099B-4EBA-B622-A94FA03BF865}\" Type=\"HTML\" Hidden=\"TRUE\" TabularView=\"FALSE\" DisplayName=\"Relink Documents\" Url=\"/sites/ninja/Shared Documents/Forms/repair.aspx\" Level=\"1\" BaseViewID=\"9\" ContentTypeID=\"0x\" ToolbarTemplate=\"RelinkToolBar\" ImageUrl=\"/_layouts/15/images/dlicon.png?rev=45\" ><Query><OrderBy><FieldRef Name=\"FileLeafRef\" /></OrderBy><Where><Neq><FieldRef Name=\"xd_Signature\" /><Value Type=\"Boolean\">1</Value></Neq></Where></Query><ViewFields><FieldRef Name=\"DocIcon\" /><FieldRef Name=\"LinkFilenameNoMenu\" /><FieldRef Name=\"RepairDocument\" /><FieldRef Name=\"Modified\" /><FieldRef Name=\"Editor\"/><FieldRef Name=\"ContentType\" /><FieldRef Name=\"TemplateUrl\" /></ViewFields><RowLimit Paged=\"TRUE\">30</RowLimit><XslLink Default=\"TRUE\">main.xsl</XslLink><Toolbar Type=\"Standard\"/></View>", "Method": null, "MobileDefaultView": false, "MobileView": false, "ModerationType": null, "NewDocumentTemplates": null, "OrderedView": false, "Paged": true, "PersonalView": false, "ViewProjectedFields": null, "ViewQuery": "<OrderBy><FieldRef Name=\"FileLeafRef\" /></OrderBy><Where><Neq><FieldRef Name=\"xd_Signature\" /><Value Type=\"Boolean\">1</Value></Neq></Where>", "ReadOnlyView": false, "RequiresClientIntegration": false, "RowLimit": 30, "Scope": 0, "ServerRelativePath": { "DecodedUrl": "/sites/ninja/Shared Documents/Forms/repair.aspx" }, "ServerRelativeUrl": "/sites/ninja/Shared Documents/Forms/repair.aspx", "StyleId": null, "TabularView": false, "Threaded": false, "Title": "Relink Documents", "Toolbar": "", "ToolbarTemplateName": "RelinkToolBar", "ViewType": "HTML", "ViewData": null, "VisualizationInfo": null }, { "Aggregations": null, "AggregationsStatus": null, "BaseViewId": "40", "ColumnWidth": null, "ContentTypeId": { "StringValue": "0x" }, "CustomFormatter": null, "DefaultView": false, "DefaultViewForContentType": false, "EditorModified": false, "Formats": null, "Hidden": true, "HtmlSchemaXml": "<View Name=\"{3D760127-982C-405E-9C93-E1F76E1A1110}\" Type=\"HTML\" Hidden=\"TRUE\" DisplayName=\"assetLibTemp\" Url=\"/sites/ninja/Shared Documents/Forms/Thumbnails.aspx\" Level=\"1\" BaseViewID=\"40\" ContentTypeID=\"0x\" ImageUrl=\"/_layouts/15/images/dlicon.png?rev=45\"><ViewFields><FieldRef Name=\"LinkFilename\" /></ViewFields><RowLimit>20</RowLimit><Query><OrderBy><FieldRef Name=\"LinkFilename\" /></OrderBy></Query></View>", "Id": "3d760127-982c-405e-9c93-e1f76e1a1110", "ImageUrl": "/_layouts/15/images/dlicon.png?rev=45", "IncludeRootFolder": false, "ViewJoins": null, "JSLink": null, "ListViewXml": "<View Name=\"{3D760127-982C-405E-9C93-E1F76E1A1110}\" Type=\"HTML\" Hidden=\"TRUE\" DisplayName=\"assetLibTemp\" Url=\"/sites/ninja/SharedDocuments/Forms/Thumbnails.aspx\" Level=\"1\" BaseViewID=\"40\" ContentTypeID=\"0x\" ImageUrl=\"/_layouts/15/images/dlicon.png?rev=45\" ><Query><OrderBy><FieldRef Name=\"LinkFilename\" /></OrderBy></Query><ViewFields><FieldRef Name=\"LinkFilename\" /></ViewFields><RowLimit>20</RowLimit><Toolbar Type=\"None\"/></View>", "Method": null, "MobileDefaultView": false, "MobileView": false, "ModerationType": null, "NewDocumentTemplates": null, "OrderedView": false, "Paged": false, "PersonalView": false, "ViewProjectedFields": null, "ViewQuery": "<OrderBy><FieldRef Name=\"LinkFilename\" /></OrderBy>", "ReadOnlyView": false, "RequiresClientIntegration": false, "RowLimit": 20, "Scope": 0, "ServerRelativePath": { "DecodedUrl": "/sites/ninja/Shared Documents/Forms/Thumbnails.aspx" }, "ServerRelativeUrl": "/sites/ninja/Shared Documents/Forms/Thumbnails.aspx", "StyleId": null, "TabularView": true, "Threaded": false, "Title": "assetLibTemp", "Toolbar": null, "ToolbarTemplateName": null, "ViewType": "HTML", "ViewData": null, "VisualizationInfo": null }, { "Aggregations": null, "AggregationsStatus": null, "BaseViewId": "7", "ColumnWidth": null, "ContentTypeId": { "StringValue": "0x" }, "CustomFormatter": null, "DefaultView": false, "DefaultViewForContentType": false, "EditorModified": false, "Formats": null, "Hidden": true, "HtmlSchemaXml": "<View Name=\"{1204C10A-978D-46C8-A6F2-65ECFA5E03D5}\" Type=\"HTML\" Hidden=\"TRUE\" TabularView=\"FALSE\" AggregateView=\"TRUE\" DisplayName=\"Merge Documents\" Url=\"/sites/ninja/Shared Documents/Forms/Combine.aspx\" Level=\"1\" BaseViewID=\"7\" ContentTypeID=\"0x\" ToolbarTemplate=\"MergeToolBar\" ImageUrl=\"/_layouts/15/images/dlicon.png?rev=45\"><XslLink Default=\"TRUE\">main.xsl</XslLink><JSLink>clienttemplates.js</JSLink><RowLimit Paged=\"TRUE\">30</RowLimit><Toolbar Type=\"Standard\" /><ViewFields><FieldRef Name=\"DocIcon\" /><FieldRef Name=\"LinkFilename\" /><FieldRef Name=\"Combine\" /><FieldRef Name=\"Modified\" /><FieldRef Name=\"Editor\" /></ViewFields><ParameterBindings><ParameterBinding Name=\"NoAnnouncements\" Location=\"Resource(wss,noitemsinview_doclibrary)\" /><ParameterBinding Name=\"NoAnnouncementsHowTo\" Location=\"Resource(wss,noitemsinview_doclibrary_howto2)\" /></ParameterBindings><Query><OrderBy><FieldRef Name=\"FileLeafRef\" /></OrderBy></Query></View>", "Id": "1204c10a-978d-46c8-a6f2-65ecfa5e03d5", "ImageUrl": "/_layouts/15/images/dlicon.png?rev=45", "IncludeRootFolder": false, "ViewJoins": null, "JSLink": "clienttemplates.js", "ListViewXml": "<View Name=\"{1204C10A-978D-46C8-A6F2-65ECFA5E03D5}\" Type=\"HTML\" Hidden=\"TRUE\" TabularView=\"FALSE\" AggregateView=\"TRUE\" DisplayName=\"Merge Documents\" Url=\"/sites/ninja/Shared Documents/Forms/Combine.aspx\" Level=\"1\" BaseViewID=\"7\" ContentTypeID=\"0x\" ToolbarTemplate=\"MergeToolBar\" ImageUrl=\"/_layouts/15/images/dlicon.png?rev=45\" ><Query><OrderBy><FieldRef Name=\"FileLeafRef\" /></OrderBy></Query><ViewFields><FieldRef Name=\"DocIcon\" /><FieldRef Name=\"LinkFilename\" /><FieldRef Name=\"Combine\" /><FieldRef Name=\"Modified\" /><FieldRef Name=\"Editor\" /></ViewFields><RowLimit Paged=\"TRUE\">30</RowLimit><JSLink>clienttemplates.js</JSLink><XslLink Default=\"TRUE\">main.xsl</XslLink><Toolbar Type=\"Standard\"/></View>", "Method": null, "MobileDefaultView": false, "MobileView": false, "ModerationType": null, "NewDocumentTemplates": null, "OrderedView": false, "Paged": true, "PersonalView": false, "ViewProjectedFields": null, "ViewQuery": "<OrderBy><FieldRef Name=\"FileLeafRef\" /></OrderBy>", "ReadOnlyView": false, "RequiresClientIntegration": false, "RowLimit": 30, "Scope": 0, "ServerRelativePath": { "DecodedUrl": "/sites/ninja/Shared Documents/Forms/Combine.aspx" }, "ServerRelativeUrl": "/sites/ninja/Shared Documents/Forms/Combine.aspx", "StyleId": null, "TabularView": false, "Threaded": false, "Title": "Merge Documents", "Toolbar": "", "ToolbarTemplateName": "MergeToolBar", "ViewType": "HTML", "ViewData": null, "VisualizationInfo": null }, { "Aggregations": null, "AggregationsStatus": null, "BaseViewId": "50", "ColumnWidth": null, "ContentTypeId": { "StringValue": "0x" }, "CustomFormatter": null, "DefaultView": false, "DefaultViewForContentType": false, "EditorModified": false, "Formats": null, "Hidden": true, "HtmlSchemaXml": "<View Name=\"{E021E923-0801-4A16-9775-545239356739}\" MobileView=\"TRUE\" Type=\"HTML\" Hidden=\"TRUE\" DisplayName=\"\" Url=\"/sites/ninja/SitePages/Home.aspx\" Level=\"1\" BaseViewID=\"50\" ContentTypeID=\"0x\"><XslLink Default=\"TRUE\">main.xsl</XslLink><JSLink>clienttemplates.js</JSLink><RowLimit Paged=\"TRUE\">15</RowLimit><Toolbar Type=\"Standard\" /><ViewFields><FieldRef Name=\"DocIcon\" /><FieldRef Name=\"LinkFilename\" /></ViewFields><ParameterBindings><ParameterBinding Name=\"NoAnnouncements\" Location=\"Resource(wss,noitemsinview_doclibrary)\" /><ParameterBinding Name=\"NoAnnouncementsHowTo\" Location=\"Resource(wss,noitemsinview_doclibrary_howto2)\" /></ParameterBindings><Query><OrderBy><FieldRef Name=\"Modified\" Ascending=\"FALSE\" /></OrderBy></Query></View>", "Id": "e021e923-0801-4a16-9775-545239356739", "ImageUrl": null, "IncludeRootFolder": false, "ViewJoins": null, "JSLink": "clienttemplates.js", "ListViewXml": "<View Name=\"{E021E923-0801-4A16-9775-545239356739}\" MobileView=\"TRUE\" Type=\"HTML\"Hidden=\"TRUE\" DisplayName=\"\" Url=\"/sites/ninja/SitePages/Home.aspx\" Level=\"1\" BaseViewID=\"50\" ContentTypeID=\"0x\" ><Query><OrderBy><FieldRef Name=\"Modified\" Ascending=\"FALSE\" /></OrderBy></Query><ViewFields><FieldRef Name=\"DocIcon\" /><FieldRef Name=\"LinkFilename\" /></ViewFields><RowLimit Paged=\"TRUE\">15</RowLimit><JSLink>clienttemplates.js</JSLink><XslLink Default=\"TRUE\">main.xsl</XslLink><Toolbar Type=\"Standard\"/></View>", "Method": null, "MobileDefaultView": false, "MobileView": true, "ModerationType": null, "NewDocumentTemplates": null, "OrderedView": false, "Paged": true, "PersonalView": false, "ViewProjectedFields": null, "ViewQuery": "<OrderBy><FieldRef Name=\"Modified\" Ascending=\"FALSE\" /></OrderBy>", "ReadOnlyView": false, "RequiresClientIntegration": false, "RowLimit": 15, "Scope": 0, "ServerRelativePath": { "DecodedUrl": "/sites/ninja/SitePages/Home.aspx" }, "ServerRelativeUrl": "/sites/ninja/SitePages/Home.aspx", "StyleId": null, "TabularView": true, "Threaded": false, "Title": "", "Toolbar": "", "ToolbarTemplateName": null, "ViewType": "HTML", "ViewData": null, "VisualizationInfo": null }]
          });
        }
      }

      return Promise.reject('Invalid request');
    });

    auth.site = new Site();
    auth.site.connected = true;
    auth.site.url = 'https://contoso-admin.sharepoint.com';
    auth.site.tenantId = 'abc';
    cmdInstance.action = command.action();
    cmdInstance.action({
      options: {
        debug: true,
        listTitle: 'Documents',
        webUrl: 'https://contoso.sharepoint.com/sites/ninja'
      }
    }, () => {
      try {
        assert(cmdInstanceLogSpy.calledWith([
          {
            "Id": "85907fb0-cda1-43ec-832e-27118c89cf9f",
            "Title": "All Documents",
            "DefaultView": true,
            "Hidden": false,
            "BaseViewId": "1"
          },
          {
            "Id": "281e80fd-099b-4eba-b622-a94fa03bf865",
            "Title": "Relink Documents",
            "DefaultView": false,
            "Hidden": true,
            "BaseViewId": "9"
          },
          {
            "Id": "3d760127-982c-405e-9c93-e1f76e1a1110",
            "Title": "assetLibTemp",
            "DefaultView": false,
            "Hidden": true,
            "BaseViewId": "40"
          },
          {
            "Id": "1204c10a-978d-46c8-a6f2-65ecfa5e03d5",
            "Title": "Merge Documents",
            "DefaultView": false,
            "Hidden": true,
            "BaseViewId": "7"
          },
          {
            "Id": "e021e923-0801-4a16-9775-545239356739",
            "Title": "",
            "DefaultView": false,
            "Hidden": true,
            "BaseViewId": "50"
          }
        ]));
        done();
      }
      catch (e) {
        done(e);
      }
    });
  });

  it('retrieves all views of the specific list if listId option is passed (debug)', (done) => {
    sinon.stub(request, 'get').callsFake((opts) => {
      if (opts.url.indexOf(`https://contoso.sharepoint.com/sites/ninja/_api/web/lists(guid'1f187321-f086-4d3d-8523-517e94cc9df9')/views`) > -1) {
        if (opts.headers.authorization &&
          opts.headers.authorization.indexOf('Bearer ') === 0 &&
          opts.headers.accept &&
          opts.headers.accept.indexOf('application/json') === 0) {
          return Promise.resolve({
            "value": [{ "Aggregations": null, "AggregationsStatus": null, "BaseViewId": "1", "ColumnWidth": null, "ContentTypeId": { "StringValue": "0x" }, "CustomFormatter": null, "DefaultView": true, "DefaultViewForContentType": false, "EditorModified": false, "Formats": null, "Hidden": false, "HtmlSchemaXml": "<View Name=\"{85907FB0-CDA1-43EC-832E-27118C89CF9F}\" DefaultView=\"TRUE\" MobileView=\"TRUE\" MobileDefaultView=\"TRUE\" Type=\"HTML\" DisplayName=\"All Documents\" Url=\"/sites/ninja/Shared Documents/Forms/AllItems.aspx\" Level=\"1\" BaseViewID=\"1\" ContentTypeID=\"0x\" ImageUrl=\"/_layouts/15/images/dlicon.png?rev=45\"><XslLink Default=\"TRUE\">main.xsl</XslLink><JSLink>clienttemplates.js</JSLink><RowLimit Paged=\"TRUE\">30</RowLimit><Toolbar Type=\"Standard\" /><ViewFields><FieldRef Name=\"DocIcon\" /><FieldRef Name=\"LinkFilename\" /><FieldRef Name=\"Modified\" /><FieldRef Name=\"Editor\" /></ViewFields><ParameterBindings><ParameterBinding Name=\"NoAnnouncements\" Location=\"Resource(wss,noitemsinview_doclibrary)\" /><ParameterBinding Name=\"NoAnnouncementsHowTo\" Location=\"Resource(wss,noitemsinview_doclibrary_howto2)\" /></ParameterBindings><Query><OrderBy><FieldRef Name=\"FileLeafRef\" /></OrderBy></Query></View>", "Id": "85907fb0-cda1-43ec-832e-27118c89cf9f", "ImageUrl": "/_layouts/15/images/dlicon.png?rev=45", "IncludeRootFolder": false, "ViewJoins": null, "JSLink": "clienttemplates.js", "ListViewXml": "<View Name=\"{85907FB0-CDA1-43EC-832E-27118C89CF9F}\" DefaultView=\"TRUE\" MobileView=\"TRUE\" MobileDefaultView=\"TRUE\" Type=\"HTML\" DisplayName=\"All Documents\" Url=\"/sites/ninja/Shared Documents/Forms/AllItems.aspx\" Level=\"1\" BaseViewID=\"1\" ContentTypeID=\"0x\" ImageUrl=\"/_layouts/15/images/dlicon.png?rev=45\" ><Query><OrderBy><FieldRef Name=\"FileLeafRef\" /></OrderBy></Query><ViewFields><FieldRef Name=\"DocIcon\" /><FieldRef Name=\"LinkFilename\" /><FieldRef Name=\"Modified\" /><FieldRef Name=\"Editor\" /></ViewFields><RowLimit Paged=\"TRUE\">30</RowLimit><JSLink>clienttemplates.js</JSLink><XslLink Default=\"TRUE\">main.xsl</XslLink><Toolbar Type=\"Standard\"/></View>", "Method": null, "MobileDefaultView": true, "MobileView": true, "ModerationType": null, "NewDocumentTemplates": null, "OrderedView": false, "Paged": true, "PersonalView": false, "ViewProjectedFields": null, "ViewQuery": "<OrderBy><FieldRef Name=\"FileLeafRef\" /></OrderBy>", "ReadOnlyView": false, "RequiresClientIntegration": false, "RowLimit": 30, "Scope": 0, "ServerRelativePath": { "DecodedUrl": "/sites/ninja/Shared Documents/Forms/AllItems.aspx" }, "ServerRelativeUrl": "/sites/ninja/Shared Documents/Forms/AllItems.aspx", "StyleId": null, "TabularView": true, "Threaded": false, "Title": "All Documents", "Toolbar": "", "ToolbarTemplateName": null, "ViewType": "HTML", "ViewData": null, "VisualizationInfo": null }, { "Aggregations": null, "AggregationsStatus": null, "BaseViewId": "9", "ColumnWidth": null, "ContentTypeId": { "StringValue": "0x" }, "CustomFormatter": null, "DefaultView": false, "DefaultViewForContentType": false, "EditorModified": false, "Formats": null, "Hidden": true, "HtmlSchemaXml": "<View Name=\"{281E80FD-099B-4EBA-B622-A94FA03BF865}\" Type=\"HTML\" Hidden=\"TRUE\" TabularView=\"FALSE\" DisplayName=\"Relink Documents\" Url=\"/sites/ninja/Shared Documents/Forms/repair.aspx\" Level=\"1\" BaseViewID=\"9\" ContentTypeID=\"0x\" ToolbarTemplate=\"RelinkToolBar\" ImageUrl=\"/_layouts/15/images/dlicon.png?rev=45\"><XslLink Default=\"TRUE\">main.xsl</XslLink><RowLimit Paged=\"TRUE\">30</RowLimit><Toolbar Type=\"Standard\" /><ViewFields><FieldRef Name=\"DocIcon\" /><FieldRef Name=\"LinkFilenameNoMenu\" /><FieldRef Name=\"RepairDocument\" /><FieldRef Name=\"Modified\" /><FieldRef Name=\"Editor\" /><FieldRef Name=\"ContentType\" /><FieldRef Name=\"TemplateUrl\" /></ViewFields><ParameterBindings><ParameterBinding Name=\"NoAnnouncements\" Location=\"Resource(wss,noitemsinview_doclibrary)\" /><ParameterBinding Name=\"NoAnnouncementsHowTo\" Location=\"Resource(wss,noitemsinview_doclibrary_howto2)\" /></ParameterBindings><Query><OrderBy><FieldRef Name=\"FileLeafRef\" /></OrderBy><Where><Neq><FieldRef Name=\"xd_Signature\" /><Value Type=\"Boolean\">1</Value></Neq></Where></Query></View>", "Id": "281e80fd-099b-4eba-b622-a94fa03bf865", "ImageUrl": "/_layouts/15/images/dlicon.png?rev=45", "IncludeRootFolder": false, "ViewJoins": null, "JSLink": null, "ListViewXml": "<View Name=\"{281E80FD-099B-4EBA-B622-A94FA03BF865}\" Type=\"HTML\" Hidden=\"TRUE\" TabularView=\"FALSE\" DisplayName=\"Relink Documents\" Url=\"/sites/ninja/Shared Documents/Forms/repair.aspx\" Level=\"1\" BaseViewID=\"9\" ContentTypeID=\"0x\" ToolbarTemplate=\"RelinkToolBar\" ImageUrl=\"/_layouts/15/images/dlicon.png?rev=45\" ><Query><OrderBy><FieldRef Name=\"FileLeafRef\" /></OrderBy><Where><Neq><FieldRef Name=\"xd_Signature\" /><Value Type=\"Boolean\">1</Value></Neq></Where></Query><ViewFields><FieldRef Name=\"DocIcon\" /><FieldRef Name=\"LinkFilenameNoMenu\" /><FieldRef Name=\"RepairDocument\" /><FieldRef Name=\"Modified\" /><FieldRef Name=\"Editor\"/><FieldRef Name=\"ContentType\" /><FieldRef Name=\"TemplateUrl\" /></ViewFields><RowLimit Paged=\"TRUE\">30</RowLimit><XslLink Default=\"TRUE\">main.xsl</XslLink><Toolbar Type=\"Standard\"/></View>", "Method": null, "MobileDefaultView": false, "MobileView": false, "ModerationType": null, "NewDocumentTemplates": null, "OrderedView": false, "Paged": true, "PersonalView": false, "ViewProjectedFields": null, "ViewQuery": "<OrderBy><FieldRef Name=\"FileLeafRef\" /></OrderBy><Where><Neq><FieldRef Name=\"xd_Signature\" /><Value Type=\"Boolean\">1</Value></Neq></Where>", "ReadOnlyView": false, "RequiresClientIntegration": false, "RowLimit": 30, "Scope": 0, "ServerRelativePath": { "DecodedUrl": "/sites/ninja/Shared Documents/Forms/repair.aspx" }, "ServerRelativeUrl": "/sites/ninja/Shared Documents/Forms/repair.aspx", "StyleId": null, "TabularView": false, "Threaded": false, "Title": "Relink Documents", "Toolbar": "", "ToolbarTemplateName": "RelinkToolBar", "ViewType": "HTML", "ViewData": null, "VisualizationInfo": null }, { "Aggregations": null, "AggregationsStatus": null, "BaseViewId": "40", "ColumnWidth": null, "ContentTypeId": { "StringValue": "0x" }, "CustomFormatter": null, "DefaultView": false, "DefaultViewForContentType": false, "EditorModified": false, "Formats": null, "Hidden": true, "HtmlSchemaXml": "<View Name=\"{3D760127-982C-405E-9C93-E1F76E1A1110}\" Type=\"HTML\" Hidden=\"TRUE\" DisplayName=\"assetLibTemp\" Url=\"/sites/ninja/Shared Documents/Forms/Thumbnails.aspx\" Level=\"1\" BaseViewID=\"40\" ContentTypeID=\"0x\" ImageUrl=\"/_layouts/15/images/dlicon.png?rev=45\"><ViewFields><FieldRef Name=\"LinkFilename\" /></ViewFields><RowLimit>20</RowLimit><Query><OrderBy><FieldRef Name=\"LinkFilename\" /></OrderBy></Query></View>", "Id": "3d760127-982c-405e-9c93-e1f76e1a1110", "ImageUrl": "/_layouts/15/images/dlicon.png?rev=45", "IncludeRootFolder": false, "ViewJoins": null, "JSLink": null, "ListViewXml": "<View Name=\"{3D760127-982C-405E-9C93-E1F76E1A1110}\" Type=\"HTML\" Hidden=\"TRUE\" DisplayName=\"assetLibTemp\" Url=\"/sites/ninja/SharedDocuments/Forms/Thumbnails.aspx\" Level=\"1\" BaseViewID=\"40\" ContentTypeID=\"0x\" ImageUrl=\"/_layouts/15/images/dlicon.png?rev=45\" ><Query><OrderBy><FieldRef Name=\"LinkFilename\" /></OrderBy></Query><ViewFields><FieldRef Name=\"LinkFilename\" /></ViewFields><RowLimit>20</RowLimit><Toolbar Type=\"None\"/></View>", "Method": null, "MobileDefaultView": false, "MobileView": false, "ModerationType": null, "NewDocumentTemplates": null, "OrderedView": false, "Paged": false, "PersonalView": false, "ViewProjectedFields": null, "ViewQuery": "<OrderBy><FieldRef Name=\"LinkFilename\" /></OrderBy>", "ReadOnlyView": false, "RequiresClientIntegration": false, "RowLimit": 20, "Scope": 0, "ServerRelativePath": { "DecodedUrl": "/sites/ninja/Shared Documents/Forms/Thumbnails.aspx" }, "ServerRelativeUrl": "/sites/ninja/Shared Documents/Forms/Thumbnails.aspx", "StyleId": null, "TabularView": true, "Threaded": false, "Title": "assetLibTemp", "Toolbar": null, "ToolbarTemplateName": null, "ViewType": "HTML", "ViewData": null, "VisualizationInfo": null }, { "Aggregations": null, "AggregationsStatus": null, "BaseViewId": "7", "ColumnWidth": null, "ContentTypeId": { "StringValue": "0x" }, "CustomFormatter": null, "DefaultView": false, "DefaultViewForContentType": false, "EditorModified": false, "Formats": null, "Hidden": true, "HtmlSchemaXml": "<View Name=\"{1204C10A-978D-46C8-A6F2-65ECFA5E03D5}\" Type=\"HTML\" Hidden=\"TRUE\" TabularView=\"FALSE\" AggregateView=\"TRUE\" DisplayName=\"Merge Documents\" Url=\"/sites/ninja/Shared Documents/Forms/Combine.aspx\" Level=\"1\" BaseViewID=\"7\" ContentTypeID=\"0x\" ToolbarTemplate=\"MergeToolBar\" ImageUrl=\"/_layouts/15/images/dlicon.png?rev=45\"><XslLink Default=\"TRUE\">main.xsl</XslLink><JSLink>clienttemplates.js</JSLink><RowLimit Paged=\"TRUE\">30</RowLimit><Toolbar Type=\"Standard\" /><ViewFields><FieldRef Name=\"DocIcon\" /><FieldRef Name=\"LinkFilename\" /><FieldRef Name=\"Combine\" /><FieldRef Name=\"Modified\" /><FieldRef Name=\"Editor\" /></ViewFields><ParameterBindings><ParameterBinding Name=\"NoAnnouncements\" Location=\"Resource(wss,noitemsinview_doclibrary)\" /><ParameterBinding Name=\"NoAnnouncementsHowTo\" Location=\"Resource(wss,noitemsinview_doclibrary_howto2)\" /></ParameterBindings><Query><OrderBy><FieldRef Name=\"FileLeafRef\" /></OrderBy></Query></View>", "Id": "1204c10a-978d-46c8-a6f2-65ecfa5e03d5", "ImageUrl": "/_layouts/15/images/dlicon.png?rev=45", "IncludeRootFolder": false, "ViewJoins": null, "JSLink": "clienttemplates.js", "ListViewXml": "<View Name=\"{1204C10A-978D-46C8-A6F2-65ECFA5E03D5}\" Type=\"HTML\" Hidden=\"TRUE\" TabularView=\"FALSE\" AggregateView=\"TRUE\" DisplayName=\"Merge Documents\" Url=\"/sites/ninja/Shared Documents/Forms/Combine.aspx\" Level=\"1\" BaseViewID=\"7\" ContentTypeID=\"0x\" ToolbarTemplate=\"MergeToolBar\" ImageUrl=\"/_layouts/15/images/dlicon.png?rev=45\" ><Query><OrderBy><FieldRef Name=\"FileLeafRef\" /></OrderBy></Query><ViewFields><FieldRef Name=\"DocIcon\" /><FieldRef Name=\"LinkFilename\" /><FieldRef Name=\"Combine\" /><FieldRef Name=\"Modified\" /><FieldRef Name=\"Editor\" /></ViewFields><RowLimit Paged=\"TRUE\">30</RowLimit><JSLink>clienttemplates.js</JSLink><XslLink Default=\"TRUE\">main.xsl</XslLink><Toolbar Type=\"Standard\"/></View>", "Method": null, "MobileDefaultView": false, "MobileView": false, "ModerationType": null, "NewDocumentTemplates": null, "OrderedView": false, "Paged": true, "PersonalView": false, "ViewProjectedFields": null, "ViewQuery": "<OrderBy><FieldRef Name=\"FileLeafRef\" /></OrderBy>", "ReadOnlyView": false, "RequiresClientIntegration": false, "RowLimit": 30, "Scope": 0, "ServerRelativePath": { "DecodedUrl": "/sites/ninja/Shared Documents/Forms/Combine.aspx" }, "ServerRelativeUrl": "/sites/ninja/Shared Documents/Forms/Combine.aspx", "StyleId": null, "TabularView": false, "Threaded": false, "Title": "Merge Documents", "Toolbar": "", "ToolbarTemplateName": "MergeToolBar", "ViewType": "HTML", "ViewData": null, "VisualizationInfo": null }, { "Aggregations": null, "AggregationsStatus": null, "BaseViewId": "50", "ColumnWidth": null, "ContentTypeId": { "StringValue": "0x" }, "CustomFormatter": null, "DefaultView": false, "DefaultViewForContentType": false, "EditorModified": false, "Formats": null, "Hidden": true, "HtmlSchemaXml": "<View Name=\"{E021E923-0801-4A16-9775-545239356739}\" MobileView=\"TRUE\" Type=\"HTML\" Hidden=\"TRUE\" DisplayName=\"\" Url=\"/sites/ninja/SitePages/Home.aspx\" Level=\"1\" BaseViewID=\"50\" ContentTypeID=\"0x\"><XslLink Default=\"TRUE\">main.xsl</XslLink><JSLink>clienttemplates.js</JSLink><RowLimit Paged=\"TRUE\">15</RowLimit><Toolbar Type=\"Standard\" /><ViewFields><FieldRef Name=\"DocIcon\" /><FieldRef Name=\"LinkFilename\" /></ViewFields><ParameterBindings><ParameterBinding Name=\"NoAnnouncements\" Location=\"Resource(wss,noitemsinview_doclibrary)\" /><ParameterBinding Name=\"NoAnnouncementsHowTo\" Location=\"Resource(wss,noitemsinview_doclibrary_howto2)\" /></ParameterBindings><Query><OrderBy><FieldRef Name=\"Modified\" Ascending=\"FALSE\" /></OrderBy></Query></View>", "Id": "e021e923-0801-4a16-9775-545239356739", "ImageUrl": null, "IncludeRootFolder": false, "ViewJoins": null, "JSLink": "clienttemplates.js", "ListViewXml": "<View Name=\"{E021E923-0801-4A16-9775-545239356739}\" MobileView=\"TRUE\" Type=\"HTML\"Hidden=\"TRUE\" DisplayName=\"\" Url=\"/sites/ninja/SitePages/Home.aspx\" Level=\"1\" BaseViewID=\"50\" ContentTypeID=\"0x\" ><Query><OrderBy><FieldRef Name=\"Modified\" Ascending=\"FALSE\" /></OrderBy></Query><ViewFields><FieldRef Name=\"DocIcon\" /><FieldRef Name=\"LinkFilename\" /></ViewFields><RowLimit Paged=\"TRUE\">15</RowLimit><JSLink>clienttemplates.js</JSLink><XslLink Default=\"TRUE\">main.xsl</XslLink><Toolbar Type=\"Standard\"/></View>", "Method": null, "MobileDefaultView": false, "MobileView": true, "ModerationType": null, "NewDocumentTemplates": null, "OrderedView": false, "Paged": true, "PersonalView": false, "ViewProjectedFields": null, "ViewQuery": "<OrderBy><FieldRef Name=\"Modified\" Ascending=\"FALSE\" /></OrderBy>", "ReadOnlyView": false, "RequiresClientIntegration": false, "RowLimit": 15, "Scope": 0, "ServerRelativePath": { "DecodedUrl": "/sites/ninja/SitePages/Home.aspx" }, "ServerRelativeUrl": "/sites/ninja/SitePages/Home.aspx", "StyleId": null, "TabularView": true, "Threaded": false, "Title": "", "Toolbar": "", "ToolbarTemplateName": null, "ViewType": "HTML", "ViewData": null, "VisualizationInfo": null }]
          });
        }
      }

      return Promise.reject('Invalid request');
    });

    auth.site = new Site();
    auth.site.connected = true;
    auth.site.url = 'https://contoso-admin.sharepoint.com';
    auth.site.tenantId = 'abc';
    cmdInstance.action = command.action();
    cmdInstance.action({
      options: {
        debug: true,
        listId: '1f187321-f086-4d3d-8523-517e94cc9df9',
        webUrl: 'https://contoso.sharepoint.com/sites/ninja'
      }
    }, () => {
      try {
        assert(cmdInstanceLogSpy.calledWith([
          {
            "Id": "85907fb0-cda1-43ec-832e-27118c89cf9f",
            "Title": "All Documents",
            "DefaultView": true,
            "Hidden": false,
            "BaseViewId": "1"
          },
          {
            "Id": "281e80fd-099b-4eba-b622-a94fa03bf865",
            "Title": "Relink Documents",
            "DefaultView": false,
            "Hidden": true,
            "BaseViewId": "9"
          },
          {
            "Id": "3d760127-982c-405e-9c93-e1f76e1a1110",
            "Title": "assetLibTemp",
            "DefaultView": false,
            "Hidden": true,
            "BaseViewId": "40"
          },
          {
            "Id": "1204c10a-978d-46c8-a6f2-65ecfa5e03d5",
            "Title": "Merge Documents",
            "DefaultView": false,
            "Hidden": true,
            "BaseViewId": "7"
          },
          {
            "Id": "e021e923-0801-4a16-9775-545239356739",
            "Title": "",
            "DefaultView": false,
            "Hidden": true,
            "BaseViewId": "50"
          }
        ]));
        done();
      }
      catch (e) {
        done(e);
      }
    });
  });

  it('retrieves all views of the specific list if listId option is passed', (done) => {
    sinon.stub(request, 'get').callsFake((opts) => {
      if (opts.url.indexOf(`https://contoso.sharepoint.com/sites/ninja/_api/web/lists(guid'1f187321-f086-4d3d-8523-517e94cc9df9')/views`) > -1) {
        if (opts.headers.authorization &&
          opts.headers.authorization.indexOf('Bearer ') === 0 &&
          opts.headers.accept &&
          opts.headers.accept.indexOf('application/json') === 0) {
          return Promise.resolve({
            "value": [{ "Aggregations": null, "AggregationsStatus": null, "BaseViewId": "1", "ColumnWidth": null, "ContentTypeId": { "StringValue": "0x" }, "CustomFormatter": null, "DefaultView": true, "DefaultViewForContentType": false, "EditorModified": false, "Formats": null, "Hidden": false, "HtmlSchemaXml": "<View Name=\"{85907FB0-CDA1-43EC-832E-27118C89CF9F}\" DefaultView=\"TRUE\" MobileView=\"TRUE\" MobileDefaultView=\"TRUE\" Type=\"HTML\" DisplayName=\"All Documents\" Url=\"/sites/ninja/Shared Documents/Forms/AllItems.aspx\" Level=\"1\" BaseViewID=\"1\" ContentTypeID=\"0x\" ImageUrl=\"/_layouts/15/images/dlicon.png?rev=45\"><XslLink Default=\"TRUE\">main.xsl</XslLink><JSLink>clienttemplates.js</JSLink><RowLimit Paged=\"TRUE\">30</RowLimit><Toolbar Type=\"Standard\" /><ViewFields><FieldRef Name=\"DocIcon\" /><FieldRef Name=\"LinkFilename\" /><FieldRef Name=\"Modified\" /><FieldRef Name=\"Editor\" /></ViewFields><ParameterBindings><ParameterBinding Name=\"NoAnnouncements\" Location=\"Resource(wss,noitemsinview_doclibrary)\" /><ParameterBinding Name=\"NoAnnouncementsHowTo\" Location=\"Resource(wss,noitemsinview_doclibrary_howto2)\" /></ParameterBindings><Query><OrderBy><FieldRef Name=\"FileLeafRef\" /></OrderBy></Query></View>", "Id": "85907fb0-cda1-43ec-832e-27118c89cf9f", "ImageUrl": "/_layouts/15/images/dlicon.png?rev=45", "IncludeRootFolder": false, "ViewJoins": null, "JSLink": "clienttemplates.js", "ListViewXml": "<View Name=\"{85907FB0-CDA1-43EC-832E-27118C89CF9F}\" DefaultView=\"TRUE\" MobileView=\"TRUE\" MobileDefaultView=\"TRUE\" Type=\"HTML\" DisplayName=\"All Documents\" Url=\"/sites/ninja/Shared Documents/Forms/AllItems.aspx\" Level=\"1\" BaseViewID=\"1\" ContentTypeID=\"0x\" ImageUrl=\"/_layouts/15/images/dlicon.png?rev=45\" ><Query><OrderBy><FieldRef Name=\"FileLeafRef\" /></OrderBy></Query><ViewFields><FieldRef Name=\"DocIcon\" /><FieldRef Name=\"LinkFilename\" /><FieldRef Name=\"Modified\" /><FieldRef Name=\"Editor\" /></ViewFields><RowLimit Paged=\"TRUE\">30</RowLimit><JSLink>clienttemplates.js</JSLink><XslLink Default=\"TRUE\">main.xsl</XslLink><Toolbar Type=\"Standard\"/></View>", "Method": null, "MobileDefaultView": true, "MobileView": true, "ModerationType": null, "NewDocumentTemplates": null, "OrderedView": false, "Paged": true, "PersonalView": false, "ViewProjectedFields": null, "ViewQuery": "<OrderBy><FieldRef Name=\"FileLeafRef\" /></OrderBy>", "ReadOnlyView": false, "RequiresClientIntegration": false, "RowLimit": 30, "Scope": 0, "ServerRelativePath": { "DecodedUrl": "/sites/ninja/Shared Documents/Forms/AllItems.aspx" }, "ServerRelativeUrl": "/sites/ninja/Shared Documents/Forms/AllItems.aspx", "StyleId": null, "TabularView": true, "Threaded": false, "Title": "All Documents", "Toolbar": "", "ToolbarTemplateName": null, "ViewType": "HTML", "ViewData": null, "VisualizationInfo": null }, { "Aggregations": null, "AggregationsStatus": null, "BaseViewId": "9", "ColumnWidth": null, "ContentTypeId": { "StringValue": "0x" }, "CustomFormatter": null, "DefaultView": false, "DefaultViewForContentType": false, "EditorModified": false, "Formats": null, "Hidden": true, "HtmlSchemaXml": "<View Name=\"{281E80FD-099B-4EBA-B622-A94FA03BF865}\" Type=\"HTML\" Hidden=\"TRUE\" TabularView=\"FALSE\" DisplayName=\"Relink Documents\" Url=\"/sites/ninja/Shared Documents/Forms/repair.aspx\" Level=\"1\" BaseViewID=\"9\" ContentTypeID=\"0x\" ToolbarTemplate=\"RelinkToolBar\" ImageUrl=\"/_layouts/15/images/dlicon.png?rev=45\"><XslLink Default=\"TRUE\">main.xsl</XslLink><RowLimit Paged=\"TRUE\">30</RowLimit><Toolbar Type=\"Standard\" /><ViewFields><FieldRef Name=\"DocIcon\" /><FieldRef Name=\"LinkFilenameNoMenu\" /><FieldRef Name=\"RepairDocument\" /><FieldRef Name=\"Modified\" /><FieldRef Name=\"Editor\" /><FieldRef Name=\"ContentType\" /><FieldRef Name=\"TemplateUrl\" /></ViewFields><ParameterBindings><ParameterBinding Name=\"NoAnnouncements\" Location=\"Resource(wss,noitemsinview_doclibrary)\" /><ParameterBinding Name=\"NoAnnouncementsHowTo\" Location=\"Resource(wss,noitemsinview_doclibrary_howto2)\" /></ParameterBindings><Query><OrderBy><FieldRef Name=\"FileLeafRef\" /></OrderBy><Where><Neq><FieldRef Name=\"xd_Signature\" /><Value Type=\"Boolean\">1</Value></Neq></Where></Query></View>", "Id": "281e80fd-099b-4eba-b622-a94fa03bf865", "ImageUrl": "/_layouts/15/images/dlicon.png?rev=45", "IncludeRootFolder": false, "ViewJoins": null, "JSLink": null, "ListViewXml": "<View Name=\"{281E80FD-099B-4EBA-B622-A94FA03BF865}\" Type=\"HTML\" Hidden=\"TRUE\" TabularView=\"FALSE\" DisplayName=\"Relink Documents\" Url=\"/sites/ninja/Shared Documents/Forms/repair.aspx\" Level=\"1\" BaseViewID=\"9\" ContentTypeID=\"0x\" ToolbarTemplate=\"RelinkToolBar\" ImageUrl=\"/_layouts/15/images/dlicon.png?rev=45\" ><Query><OrderBy><FieldRef Name=\"FileLeafRef\" /></OrderBy><Where><Neq><FieldRef Name=\"xd_Signature\" /><Value Type=\"Boolean\">1</Value></Neq></Where></Query><ViewFields><FieldRef Name=\"DocIcon\" /><FieldRef Name=\"LinkFilenameNoMenu\" /><FieldRef Name=\"RepairDocument\" /><FieldRef Name=\"Modified\" /><FieldRef Name=\"Editor\"/><FieldRef Name=\"ContentType\" /><FieldRef Name=\"TemplateUrl\" /></ViewFields><RowLimit Paged=\"TRUE\">30</RowLimit><XslLink Default=\"TRUE\">main.xsl</XslLink><Toolbar Type=\"Standard\"/></View>", "Method": null, "MobileDefaultView": false, "MobileView": false, "ModerationType": null, "NewDocumentTemplates": null, "OrderedView": false, "Paged": true, "PersonalView": false, "ViewProjectedFields": null, "ViewQuery": "<OrderBy><FieldRef Name=\"FileLeafRef\" /></OrderBy><Where><Neq><FieldRef Name=\"xd_Signature\" /><Value Type=\"Boolean\">1</Value></Neq></Where>", "ReadOnlyView": false, "RequiresClientIntegration": false, "RowLimit": 30, "Scope": 0, "ServerRelativePath": { "DecodedUrl": "/sites/ninja/Shared Documents/Forms/repair.aspx" }, "ServerRelativeUrl": "/sites/ninja/Shared Documents/Forms/repair.aspx", "StyleId": null, "TabularView": false, "Threaded": false, "Title": "Relink Documents", "Toolbar": "", "ToolbarTemplateName": "RelinkToolBar", "ViewType": "HTML", "ViewData": null, "VisualizationInfo": null }, { "Aggregations": null, "AggregationsStatus": null, "BaseViewId": "40", "ColumnWidth": null, "ContentTypeId": { "StringValue": "0x" }, "CustomFormatter": null, "DefaultView": false, "DefaultViewForContentType": false, "EditorModified": false, "Formats": null, "Hidden": true, "HtmlSchemaXml": "<View Name=\"{3D760127-982C-405E-9C93-E1F76E1A1110}\" Type=\"HTML\" Hidden=\"TRUE\" DisplayName=\"assetLibTemp\" Url=\"/sites/ninja/Shared Documents/Forms/Thumbnails.aspx\" Level=\"1\" BaseViewID=\"40\" ContentTypeID=\"0x\" ImageUrl=\"/_layouts/15/images/dlicon.png?rev=45\"><ViewFields><FieldRef Name=\"LinkFilename\" /></ViewFields><RowLimit>20</RowLimit><Query><OrderBy><FieldRef Name=\"LinkFilename\" /></OrderBy></Query></View>", "Id": "3d760127-982c-405e-9c93-e1f76e1a1110", "ImageUrl": "/_layouts/15/images/dlicon.png?rev=45", "IncludeRootFolder": false, "ViewJoins": null, "JSLink": null, "ListViewXml": "<View Name=\"{3D760127-982C-405E-9C93-E1F76E1A1110}\" Type=\"HTML\" Hidden=\"TRUE\" DisplayName=\"assetLibTemp\" Url=\"/sites/ninja/SharedDocuments/Forms/Thumbnails.aspx\" Level=\"1\" BaseViewID=\"40\" ContentTypeID=\"0x\" ImageUrl=\"/_layouts/15/images/dlicon.png?rev=45\" ><Query><OrderBy><FieldRef Name=\"LinkFilename\" /></OrderBy></Query><ViewFields><FieldRef Name=\"LinkFilename\" /></ViewFields><RowLimit>20</RowLimit><Toolbar Type=\"None\"/></View>", "Method": null, "MobileDefaultView": false, "MobileView": false, "ModerationType": null, "NewDocumentTemplates": null, "OrderedView": false, "Paged": false, "PersonalView": false, "ViewProjectedFields": null, "ViewQuery": "<OrderBy><FieldRef Name=\"LinkFilename\" /></OrderBy>", "ReadOnlyView": false, "RequiresClientIntegration": false, "RowLimit": 20, "Scope": 0, "ServerRelativePath": { "DecodedUrl": "/sites/ninja/Shared Documents/Forms/Thumbnails.aspx" }, "ServerRelativeUrl": "/sites/ninja/Shared Documents/Forms/Thumbnails.aspx", "StyleId": null, "TabularView": true, "Threaded": false, "Title": "assetLibTemp", "Toolbar": null, "ToolbarTemplateName": null, "ViewType": "HTML", "ViewData": null, "VisualizationInfo": null }, { "Aggregations": null, "AggregationsStatus": null, "BaseViewId": "7", "ColumnWidth": null, "ContentTypeId": { "StringValue": "0x" }, "CustomFormatter": null, "DefaultView": false, "DefaultViewForContentType": false, "EditorModified": false, "Formats": null, "Hidden": true, "HtmlSchemaXml": "<View Name=\"{1204C10A-978D-46C8-A6F2-65ECFA5E03D5}\" Type=\"HTML\" Hidden=\"TRUE\" TabularView=\"FALSE\" AggregateView=\"TRUE\" DisplayName=\"Merge Documents\" Url=\"/sites/ninja/Shared Documents/Forms/Combine.aspx\" Level=\"1\" BaseViewID=\"7\" ContentTypeID=\"0x\" ToolbarTemplate=\"MergeToolBar\" ImageUrl=\"/_layouts/15/images/dlicon.png?rev=45\"><XslLink Default=\"TRUE\">main.xsl</XslLink><JSLink>clienttemplates.js</JSLink><RowLimit Paged=\"TRUE\">30</RowLimit><Toolbar Type=\"Standard\" /><ViewFields><FieldRef Name=\"DocIcon\" /><FieldRef Name=\"LinkFilename\" /><FieldRef Name=\"Combine\" /><FieldRef Name=\"Modified\" /><FieldRef Name=\"Editor\" /></ViewFields><ParameterBindings><ParameterBinding Name=\"NoAnnouncements\" Location=\"Resource(wss,noitemsinview_doclibrary)\" /><ParameterBinding Name=\"NoAnnouncementsHowTo\" Location=\"Resource(wss,noitemsinview_doclibrary_howto2)\" /></ParameterBindings><Query><OrderBy><FieldRef Name=\"FileLeafRef\" /></OrderBy></Query></View>", "Id": "1204c10a-978d-46c8-a6f2-65ecfa5e03d5", "ImageUrl": "/_layouts/15/images/dlicon.png?rev=45", "IncludeRootFolder": false, "ViewJoins": null, "JSLink": "clienttemplates.js", "ListViewXml": "<View Name=\"{1204C10A-978D-46C8-A6F2-65ECFA5E03D5}\" Type=\"HTML\" Hidden=\"TRUE\" TabularView=\"FALSE\" AggregateView=\"TRUE\" DisplayName=\"Merge Documents\" Url=\"/sites/ninja/Shared Documents/Forms/Combine.aspx\" Level=\"1\" BaseViewID=\"7\" ContentTypeID=\"0x\" ToolbarTemplate=\"MergeToolBar\" ImageUrl=\"/_layouts/15/images/dlicon.png?rev=45\" ><Query><OrderBy><FieldRef Name=\"FileLeafRef\" /></OrderBy></Query><ViewFields><FieldRef Name=\"DocIcon\" /><FieldRef Name=\"LinkFilename\" /><FieldRef Name=\"Combine\" /><FieldRef Name=\"Modified\" /><FieldRef Name=\"Editor\" /></ViewFields><RowLimit Paged=\"TRUE\">30</RowLimit><JSLink>clienttemplates.js</JSLink><XslLink Default=\"TRUE\">main.xsl</XslLink><Toolbar Type=\"Standard\"/></View>", "Method": null, "MobileDefaultView": false, "MobileView": false, "ModerationType": null, "NewDocumentTemplates": null, "OrderedView": false, "Paged": true, "PersonalView": false, "ViewProjectedFields": null, "ViewQuery": "<OrderBy><FieldRef Name=\"FileLeafRef\" /></OrderBy>", "ReadOnlyView": false, "RequiresClientIntegration": false, "RowLimit": 30, "Scope": 0, "ServerRelativePath": { "DecodedUrl": "/sites/ninja/Shared Documents/Forms/Combine.aspx" }, "ServerRelativeUrl": "/sites/ninja/Shared Documents/Forms/Combine.aspx", "StyleId": null, "TabularView": false, "Threaded": false, "Title": "Merge Documents", "Toolbar": "", "ToolbarTemplateName": "MergeToolBar", "ViewType": "HTML", "ViewData": null, "VisualizationInfo": null }, { "Aggregations": null, "AggregationsStatus": null, "BaseViewId": "50", "ColumnWidth": null, "ContentTypeId": { "StringValue": "0x" }, "CustomFormatter": null, "DefaultView": false, "DefaultViewForContentType": false, "EditorModified": false, "Formats": null, "Hidden": true, "HtmlSchemaXml": "<View Name=\"{E021E923-0801-4A16-9775-545239356739}\" MobileView=\"TRUE\" Type=\"HTML\" Hidden=\"TRUE\" DisplayName=\"\" Url=\"/sites/ninja/SitePages/Home.aspx\" Level=\"1\" BaseViewID=\"50\" ContentTypeID=\"0x\"><XslLink Default=\"TRUE\">main.xsl</XslLink><JSLink>clienttemplates.js</JSLink><RowLimit Paged=\"TRUE\">15</RowLimit><Toolbar Type=\"Standard\" /><ViewFields><FieldRef Name=\"DocIcon\" /><FieldRef Name=\"LinkFilename\" /></ViewFields><ParameterBindings><ParameterBinding Name=\"NoAnnouncements\" Location=\"Resource(wss,noitemsinview_doclibrary)\" /><ParameterBinding Name=\"NoAnnouncementsHowTo\" Location=\"Resource(wss,noitemsinview_doclibrary_howto2)\" /></ParameterBindings><Query><OrderBy><FieldRef Name=\"Modified\" Ascending=\"FALSE\" /></OrderBy></Query></View>", "Id": "e021e923-0801-4a16-9775-545239356739", "ImageUrl": null, "IncludeRootFolder": false, "ViewJoins": null, "JSLink": "clienttemplates.js", "ListViewXml": "<View Name=\"{E021E923-0801-4A16-9775-545239356739}\" MobileView=\"TRUE\" Type=\"HTML\"Hidden=\"TRUE\" DisplayName=\"\" Url=\"/sites/ninja/SitePages/Home.aspx\" Level=\"1\" BaseViewID=\"50\" ContentTypeID=\"0x\" ><Query><OrderBy><FieldRef Name=\"Modified\" Ascending=\"FALSE\" /></OrderBy></Query><ViewFields><FieldRef Name=\"DocIcon\" /><FieldRef Name=\"LinkFilename\" /></ViewFields><RowLimit Paged=\"TRUE\">15</RowLimit><JSLink>clienttemplates.js</JSLink><XslLink Default=\"TRUE\">main.xsl</XslLink><Toolbar Type=\"Standard\"/></View>", "Method": null, "MobileDefaultView": false, "MobileView": true, "ModerationType": null, "NewDocumentTemplates": null, "OrderedView": false, "Paged": true, "PersonalView": false, "ViewProjectedFields": null, "ViewQuery": "<OrderBy><FieldRef Name=\"Modified\" Ascending=\"FALSE\" /></OrderBy>", "ReadOnlyView": false, "RequiresClientIntegration": false, "RowLimit": 15, "Scope": 0, "ServerRelativePath": { "DecodedUrl": "/sites/ninja/SitePages/Home.aspx" }, "ServerRelativeUrl": "/sites/ninja/SitePages/Home.aspx", "StyleId": null, "TabularView": true, "Threaded": false, "Title": "", "Toolbar": "", "ToolbarTemplateName": null, "ViewType": "HTML", "ViewData": null, "VisualizationInfo": null }]
          });
        }
      }

      return Promise.reject('Invalid request');
    });

    auth.site = new Site();
    auth.site.connected = true;
    auth.site.url = 'https://contoso-admin.sharepoint.com';
    auth.site.tenantId = 'abc';
    cmdInstance.action = command.action();
    cmdInstance.action({
      options: {
        debug: false,
        listId: '1f187321-f086-4d3d-8523-517e94cc9df9',
        webUrl: 'https://contoso.sharepoint.com/sites/ninja'
      }
    }, () => {
      try {
        assert(cmdInstanceLogSpy.calledWith([
          {
            "Id": "85907fb0-cda1-43ec-832e-27118c89cf9f",
            "Title": "All Documents",
            "DefaultView": true,
            "Hidden": false,
            "BaseViewId": "1"
          },
          {
            "Id": "281e80fd-099b-4eba-b622-a94fa03bf865",
            "Title": "Relink Documents",
            "DefaultView": false,
            "Hidden": true,
            "BaseViewId": "9"
          },
          {
            "Id": "3d760127-982c-405e-9c93-e1f76e1a1110",
            "Title": "assetLibTemp",
            "DefaultView": false,
            "Hidden": true,
            "BaseViewId": "40"
          },
          {
            "Id": "1204c10a-978d-46c8-a6f2-65ecfa5e03d5",
            "Title": "Merge Documents",
            "DefaultView": false,
            "Hidden": true,
            "BaseViewId": "7"
          },
          {
            "Id": "e021e923-0801-4a16-9775-545239356739",
            "Title": "",
            "DefaultView": false,
            "Hidden": true,
            "BaseViewId": "50"
          }
        ]));
        done();
      }
      catch (e) {
        done(e);
      }
    });
  });

  it('outputs all properties when output is JSON', (done) => {
    sinon.stub(request, 'get').callsFake((opts) => {
      if (opts.url.indexOf(`https://contoso.sharepoint.com/sites/ninja/_api/web/lists(guid'1f187321-f086-4d3d-8523-517e94cc9df9')/views`) > -1) {
        if (opts.headers.authorization &&
          opts.headers.authorization.indexOf('Bearer ') === 0 &&
          opts.headers.accept &&
          opts.headers.accept.indexOf('application/json') === 0) {
          return Promise.resolve({
            "value": [{ "Aggregations": null, "AggregationsStatus": null, "BaseViewId": "1", "ColumnWidth": null, "ContentTypeId": { "StringValue": "0x" }, "CustomFormatter": null, "DefaultView": true, "DefaultViewForContentType": false, "EditorModified": false, "Formats": null, "Hidden": false, "HtmlSchemaXml": "<View Name=\"{85907FB0-CDA1-43EC-832E-27118C89CF9F}\" DefaultView=\"TRUE\" MobileView=\"TRUE\" MobileDefaultView=\"TRUE\" Type=\"HTML\" DisplayName=\"All Documents\" Url=\"/sites/ninja/Shared Documents/Forms/AllItems.aspx\" Level=\"1\" BaseViewID=\"1\" ContentTypeID=\"0x\" ImageUrl=\"/_layouts/15/images/dlicon.png?rev=45\"><XslLink Default=\"TRUE\">main.xsl</XslLink><JSLink>clienttemplates.js</JSLink><RowLimit Paged=\"TRUE\">30</RowLimit><Toolbar Type=\"Standard\" /><ViewFields><FieldRef Name=\"DocIcon\" /><FieldRef Name=\"LinkFilename\" /><FieldRef Name=\"Modified\" /><FieldRef Name=\"Editor\" /></ViewFields><ParameterBindings><ParameterBinding Name=\"NoAnnouncements\" Location=\"Resource(wss,noitemsinview_doclibrary)\" /><ParameterBinding Name=\"NoAnnouncementsHowTo\" Location=\"Resource(wss,noitemsinview_doclibrary_howto2)\" /></ParameterBindings><Query><OrderBy><FieldRef Name=\"FileLeafRef\" /></OrderBy></Query></View>", "Id": "85907fb0-cda1-43ec-832e-27118c89cf9f", "ImageUrl": "/_layouts/15/images/dlicon.png?rev=45", "IncludeRootFolder": false, "ViewJoins": null, "JSLink": "clienttemplates.js", "ListViewXml": "<View Name=\"{85907FB0-CDA1-43EC-832E-27118C89CF9F}\" DefaultView=\"TRUE\" MobileView=\"TRUE\" MobileDefaultView=\"TRUE\" Type=\"HTML\" DisplayName=\"All Documents\" Url=\"/sites/ninja/Shared Documents/Forms/AllItems.aspx\" Level=\"1\" BaseViewID=\"1\" ContentTypeID=\"0x\" ImageUrl=\"/_layouts/15/images/dlicon.png?rev=45\" ><Query><OrderBy><FieldRef Name=\"FileLeafRef\" /></OrderBy></Query><ViewFields><FieldRef Name=\"DocIcon\" /><FieldRef Name=\"LinkFilename\" /><FieldRef Name=\"Modified\" /><FieldRef Name=\"Editor\" /></ViewFields><RowLimit Paged=\"TRUE\">30</RowLimit><JSLink>clienttemplates.js</JSLink><XslLink Default=\"TRUE\">main.xsl</XslLink><Toolbar Type=\"Standard\"/></View>", "Method": null, "MobileDefaultView": true, "MobileView": true, "ModerationType": null, "NewDocumentTemplates": null, "OrderedView": false, "Paged": true, "PersonalView": false, "ViewProjectedFields": null, "ViewQuery": "<OrderBy><FieldRef Name=\"FileLeafRef\" /></OrderBy>", "ReadOnlyView": false, "RequiresClientIntegration": false, "RowLimit": 30, "Scope": 0, "ServerRelativePath": { "DecodedUrl": "/sites/ninja/Shared Documents/Forms/AllItems.aspx" }, "ServerRelativeUrl": "/sites/ninja/Shared Documents/Forms/AllItems.aspx", "StyleId": null, "TabularView": true, "Threaded": false, "Title": "All Documents", "Toolbar": "", "ToolbarTemplateName": null, "ViewType": "HTML", "ViewData": null, "VisualizationInfo": null }, { "Aggregations": null, "AggregationsStatus": null, "BaseViewId": "9", "ColumnWidth": null, "ContentTypeId": { "StringValue": "0x" }, "CustomFormatter": null, "DefaultView": false, "DefaultViewForContentType": false, "EditorModified": false, "Formats": null, "Hidden": true, "HtmlSchemaXml": "<View Name=\"{281E80FD-099B-4EBA-B622-A94FA03BF865}\" Type=\"HTML\" Hidden=\"TRUE\" TabularView=\"FALSE\" DisplayName=\"Relink Documents\" Url=\"/sites/ninja/Shared Documents/Forms/repair.aspx\" Level=\"1\" BaseViewID=\"9\" ContentTypeID=\"0x\" ToolbarTemplate=\"RelinkToolBar\" ImageUrl=\"/_layouts/15/images/dlicon.png?rev=45\"><XslLink Default=\"TRUE\">main.xsl</XslLink><RowLimit Paged=\"TRUE\">30</RowLimit><Toolbar Type=\"Standard\" /><ViewFields><FieldRef Name=\"DocIcon\" /><FieldRef Name=\"LinkFilenameNoMenu\" /><FieldRef Name=\"RepairDocument\" /><FieldRef Name=\"Modified\" /><FieldRef Name=\"Editor\" /><FieldRef Name=\"ContentType\" /><FieldRef Name=\"TemplateUrl\" /></ViewFields><ParameterBindings><ParameterBinding Name=\"NoAnnouncements\" Location=\"Resource(wss,noitemsinview_doclibrary)\" /><ParameterBinding Name=\"NoAnnouncementsHowTo\" Location=\"Resource(wss,noitemsinview_doclibrary_howto2)\" /></ParameterBindings><Query><OrderBy><FieldRef Name=\"FileLeafRef\" /></OrderBy><Where><Neq><FieldRef Name=\"xd_Signature\" /><Value Type=\"Boolean\">1</Value></Neq></Where></Query></View>", "Id": "281e80fd-099b-4eba-b622-a94fa03bf865", "ImageUrl": "/_layouts/15/images/dlicon.png?rev=45", "IncludeRootFolder": false, "ViewJoins": null, "JSLink": null, "ListViewXml": "<View Name=\"{281E80FD-099B-4EBA-B622-A94FA03BF865}\" Type=\"HTML\" Hidden=\"TRUE\" TabularView=\"FALSE\" DisplayName=\"Relink Documents\" Url=\"/sites/ninja/Shared Documents/Forms/repair.aspx\" Level=\"1\" BaseViewID=\"9\" ContentTypeID=\"0x\" ToolbarTemplate=\"RelinkToolBar\" ImageUrl=\"/_layouts/15/images/dlicon.png?rev=45\" ><Query><OrderBy><FieldRef Name=\"FileLeafRef\" /></OrderBy><Where><Neq><FieldRef Name=\"xd_Signature\" /><Value Type=\"Boolean\">1</Value></Neq></Where></Query><ViewFields><FieldRef Name=\"DocIcon\" /><FieldRef Name=\"LinkFilenameNoMenu\" /><FieldRef Name=\"RepairDocument\" /><FieldRef Name=\"Modified\" /><FieldRef Name=\"Editor\"/><FieldRef Name=\"ContentType\" /><FieldRef Name=\"TemplateUrl\" /></ViewFields><RowLimit Paged=\"TRUE\">30</RowLimit><XslLink Default=\"TRUE\">main.xsl</XslLink><Toolbar Type=\"Standard\"/></View>", "Method": null, "MobileDefaultView": false, "MobileView": false, "ModerationType": null, "NewDocumentTemplates": null, "OrderedView": false, "Paged": true, "PersonalView": false, "ViewProjectedFields": null, "ViewQuery": "<OrderBy><FieldRef Name=\"FileLeafRef\" /></OrderBy><Where><Neq><FieldRef Name=\"xd_Signature\" /><Value Type=\"Boolean\">1</Value></Neq></Where>", "ReadOnlyView": false, "RequiresClientIntegration": false, "RowLimit": 30, "Scope": 0, "ServerRelativePath": { "DecodedUrl": "/sites/ninja/Shared Documents/Forms/repair.aspx" }, "ServerRelativeUrl": "/sites/ninja/Shared Documents/Forms/repair.aspx", "StyleId": null, "TabularView": false, "Threaded": false, "Title": "Relink Documents", "Toolbar": "", "ToolbarTemplateName": "RelinkToolBar", "ViewType": "HTML", "ViewData": null, "VisualizationInfo": null }, { "Aggregations": null, "AggregationsStatus": null, "BaseViewId": "40", "ColumnWidth": null, "ContentTypeId": { "StringValue": "0x" }, "CustomFormatter": null, "DefaultView": false, "DefaultViewForContentType": false, "EditorModified": false, "Formats": null, "Hidden": true, "HtmlSchemaXml": "<View Name=\"{3D760127-982C-405E-9C93-E1F76E1A1110}\" Type=\"HTML\" Hidden=\"TRUE\" DisplayName=\"assetLibTemp\" Url=\"/sites/ninja/Shared Documents/Forms/Thumbnails.aspx\" Level=\"1\" BaseViewID=\"40\" ContentTypeID=\"0x\" ImageUrl=\"/_layouts/15/images/dlicon.png?rev=45\"><ViewFields><FieldRef Name=\"LinkFilename\" /></ViewFields><RowLimit>20</RowLimit><Query><OrderBy><FieldRef Name=\"LinkFilename\" /></OrderBy></Query></View>", "Id": "3d760127-982c-405e-9c93-e1f76e1a1110", "ImageUrl": "/_layouts/15/images/dlicon.png?rev=45", "IncludeRootFolder": false, "ViewJoins": null, "JSLink": null, "ListViewXml": "<View Name=\"{3D760127-982C-405E-9C93-E1F76E1A1110}\" Type=\"HTML\" Hidden=\"TRUE\" DisplayName=\"assetLibTemp\" Url=\"/sites/ninja/SharedDocuments/Forms/Thumbnails.aspx\" Level=\"1\" BaseViewID=\"40\" ContentTypeID=\"0x\" ImageUrl=\"/_layouts/15/images/dlicon.png?rev=45\" ><Query><OrderBy><FieldRef Name=\"LinkFilename\" /></OrderBy></Query><ViewFields><FieldRef Name=\"LinkFilename\" /></ViewFields><RowLimit>20</RowLimit><Toolbar Type=\"None\"/></View>", "Method": null, "MobileDefaultView": false, "MobileView": false, "ModerationType": null, "NewDocumentTemplates": null, "OrderedView": false, "Paged": false, "PersonalView": false, "ViewProjectedFields": null, "ViewQuery": "<OrderBy><FieldRef Name=\"LinkFilename\" /></OrderBy>", "ReadOnlyView": false, "RequiresClientIntegration": false, "RowLimit": 20, "Scope": 0, "ServerRelativePath": { "DecodedUrl": "/sites/ninja/Shared Documents/Forms/Thumbnails.aspx" }, "ServerRelativeUrl": "/sites/ninja/Shared Documents/Forms/Thumbnails.aspx", "StyleId": null, "TabularView": true, "Threaded": false, "Title": "assetLibTemp", "Toolbar": null, "ToolbarTemplateName": null, "ViewType": "HTML", "ViewData": null, "VisualizationInfo": null }, { "Aggregations": null, "AggregationsStatus": null, "BaseViewId": "7", "ColumnWidth": null, "ContentTypeId": { "StringValue": "0x" }, "CustomFormatter": null, "DefaultView": false, "DefaultViewForContentType": false, "EditorModified": false, "Formats": null, "Hidden": true, "HtmlSchemaXml": "<View Name=\"{1204C10A-978D-46C8-A6F2-65ECFA5E03D5}\" Type=\"HTML\" Hidden=\"TRUE\" TabularView=\"FALSE\" AggregateView=\"TRUE\" DisplayName=\"Merge Documents\" Url=\"/sites/ninja/Shared Documents/Forms/Combine.aspx\" Level=\"1\" BaseViewID=\"7\" ContentTypeID=\"0x\" ToolbarTemplate=\"MergeToolBar\" ImageUrl=\"/_layouts/15/images/dlicon.png?rev=45\"><XslLink Default=\"TRUE\">main.xsl</XslLink><JSLink>clienttemplates.js</JSLink><RowLimit Paged=\"TRUE\">30</RowLimit><Toolbar Type=\"Standard\" /><ViewFields><FieldRef Name=\"DocIcon\" /><FieldRef Name=\"LinkFilename\" /><FieldRef Name=\"Combine\" /><FieldRef Name=\"Modified\" /><FieldRef Name=\"Editor\" /></ViewFields><ParameterBindings><ParameterBinding Name=\"NoAnnouncements\" Location=\"Resource(wss,noitemsinview_doclibrary)\" /><ParameterBinding Name=\"NoAnnouncementsHowTo\" Location=\"Resource(wss,noitemsinview_doclibrary_howto2)\" /></ParameterBindings><Query><OrderBy><FieldRef Name=\"FileLeafRef\" /></OrderBy></Query></View>", "Id": "1204c10a-978d-46c8-a6f2-65ecfa5e03d5", "ImageUrl": "/_layouts/15/images/dlicon.png?rev=45", "IncludeRootFolder": false, "ViewJoins": null, "JSLink": "clienttemplates.js", "ListViewXml": "<View Name=\"{1204C10A-978D-46C8-A6F2-65ECFA5E03D5}\" Type=\"HTML\" Hidden=\"TRUE\" TabularView=\"FALSE\" AggregateView=\"TRUE\" DisplayName=\"Merge Documents\" Url=\"/sites/ninja/Shared Documents/Forms/Combine.aspx\" Level=\"1\" BaseViewID=\"7\" ContentTypeID=\"0x\" ToolbarTemplate=\"MergeToolBar\" ImageUrl=\"/_layouts/15/images/dlicon.png?rev=45\" ><Query><OrderBy><FieldRef Name=\"FileLeafRef\" /></OrderBy></Query><ViewFields><FieldRef Name=\"DocIcon\" /><FieldRef Name=\"LinkFilename\" /><FieldRef Name=\"Combine\" /><FieldRef Name=\"Modified\" /><FieldRef Name=\"Editor\" /></ViewFields><RowLimit Paged=\"TRUE\">30</RowLimit><JSLink>clienttemplates.js</JSLink><XslLink Default=\"TRUE\">main.xsl</XslLink><Toolbar Type=\"Standard\"/></View>", "Method": null, "MobileDefaultView": false, "MobileView": false, "ModerationType": null, "NewDocumentTemplates": null, "OrderedView": false, "Paged": true, "PersonalView": false, "ViewProjectedFields": null, "ViewQuery": "<OrderBy><FieldRef Name=\"FileLeafRef\" /></OrderBy>", "ReadOnlyView": false, "RequiresClientIntegration": false, "RowLimit": 30, "Scope": 0, "ServerRelativePath": { "DecodedUrl": "/sites/ninja/Shared Documents/Forms/Combine.aspx" }, "ServerRelativeUrl": "/sites/ninja/Shared Documents/Forms/Combine.aspx", "StyleId": null, "TabularView": false, "Threaded": false, "Title": "Merge Documents", "Toolbar": "", "ToolbarTemplateName": "MergeToolBar", "ViewType": "HTML", "ViewData": null, "VisualizationInfo": null }, { "Aggregations": null, "AggregationsStatus": null, "BaseViewId": "50", "ColumnWidth": null, "ContentTypeId": { "StringValue": "0x" }, "CustomFormatter": null, "DefaultView": false, "DefaultViewForContentType": false, "EditorModified": false, "Formats": null, "Hidden": true, "HtmlSchemaXml": "<View Name=\"{E021E923-0801-4A16-9775-545239356739}\" MobileView=\"TRUE\" Type=\"HTML\" Hidden=\"TRUE\" DisplayName=\"\" Url=\"/sites/ninja/SitePages/Home.aspx\" Level=\"1\" BaseViewID=\"50\" ContentTypeID=\"0x\"><XslLink Default=\"TRUE\">main.xsl</XslLink><JSLink>clienttemplates.js</JSLink><RowLimit Paged=\"TRUE\">15</RowLimit><Toolbar Type=\"Standard\" /><ViewFields><FieldRef Name=\"DocIcon\" /><FieldRef Name=\"LinkFilename\" /></ViewFields><ParameterBindings><ParameterBinding Name=\"NoAnnouncements\" Location=\"Resource(wss,noitemsinview_doclibrary)\" /><ParameterBinding Name=\"NoAnnouncementsHowTo\" Location=\"Resource(wss,noitemsinview_doclibrary_howto2)\" /></ParameterBindings><Query><OrderBy><FieldRef Name=\"Modified\" Ascending=\"FALSE\" /></OrderBy></Query></View>", "Id": "e021e923-0801-4a16-9775-545239356739", "ImageUrl": null, "IncludeRootFolder": false, "ViewJoins": null, "JSLink": "clienttemplates.js", "ListViewXml": "<View Name=\"{E021E923-0801-4A16-9775-545239356739}\" MobileView=\"TRUE\" Type=\"HTML\"Hidden=\"TRUE\" DisplayName=\"\" Url=\"/sites/ninja/SitePages/Home.aspx\" Level=\"1\" BaseViewID=\"50\" ContentTypeID=\"0x\" ><Query><OrderBy><FieldRef Name=\"Modified\" Ascending=\"FALSE\" /></OrderBy></Query><ViewFields><FieldRef Name=\"DocIcon\" /><FieldRef Name=\"LinkFilename\" /></ViewFields><RowLimit Paged=\"TRUE\">15</RowLimit><JSLink>clienttemplates.js</JSLink><XslLink Default=\"TRUE\">main.xsl</XslLink><Toolbar Type=\"Standard\"/></View>", "Method": null, "MobileDefaultView": false, "MobileView": true, "ModerationType": null, "NewDocumentTemplates": null, "OrderedView": false, "Paged": true, "PersonalView": false, "ViewProjectedFields": null, "ViewQuery": "<OrderBy><FieldRef Name=\"Modified\" Ascending=\"FALSE\" /></OrderBy>", "ReadOnlyView": false, "RequiresClientIntegration": false, "RowLimit": 15, "Scope": 0, "ServerRelativePath": { "DecodedUrl": "/sites/ninja/SitePages/Home.aspx" }, "ServerRelativeUrl": "/sites/ninja/SitePages/Home.aspx", "StyleId": null, "TabularView": true, "Threaded": false, "Title": "", "Toolbar": "", "ToolbarTemplateName": null, "ViewType": "HTML", "ViewData": null, "VisualizationInfo": null }]
          });
        }
      }

      return Promise.reject('Invalid request');
    });

    auth.site = new Site();
    auth.site.connected = true;
    auth.site.url = 'https://contoso-admin.sharepoint.com';
    auth.site.tenantId = 'abc';
    cmdInstance.action = command.action();
    cmdInstance.action({
      options: {
        debug: false,
        listId: '1f187321-f086-4d3d-8523-517e94cc9df9',
        webUrl: 'https://contoso.sharepoint.com/sites/ninja',
        output: 'json'
      }
    }, () => {
      try {
        assert(cmdInstanceLogSpy.calledWith([{ "Aggregations": null, "AggregationsStatus": null, "BaseViewId": "1", "ColumnWidth": null, "ContentTypeId": { "StringValue": "0x" }, "CustomFormatter": null, "DefaultView": true, "DefaultViewForContentType": false, "EditorModified": false, "Formats": null, "Hidden": false, "HtmlSchemaXml": "<View Name=\"{85907FB0-CDA1-43EC-832E-27118C89CF9F}\" DefaultView=\"TRUE\" MobileView=\"TRUE\" MobileDefaultView=\"TRUE\" Type=\"HTML\" DisplayName=\"All Documents\" Url=\"/sites/ninja/Shared Documents/Forms/AllItems.aspx\" Level=\"1\" BaseViewID=\"1\" ContentTypeID=\"0x\" ImageUrl=\"/_layouts/15/images/dlicon.png?rev=45\"><XslLink Default=\"TRUE\">main.xsl</XslLink><JSLink>clienttemplates.js</JSLink><RowLimit Paged=\"TRUE\">30</RowLimit><Toolbar Type=\"Standard\" /><ViewFields><FieldRef Name=\"DocIcon\" /><FieldRef Name=\"LinkFilename\" /><FieldRef Name=\"Modified\" /><FieldRef Name=\"Editor\" /></ViewFields><ParameterBindings><ParameterBinding Name=\"NoAnnouncements\" Location=\"Resource(wss,noitemsinview_doclibrary)\" /><ParameterBinding Name=\"NoAnnouncementsHowTo\" Location=\"Resource(wss,noitemsinview_doclibrary_howto2)\" /></ParameterBindings><Query><OrderBy><FieldRef Name=\"FileLeafRef\" /></OrderBy></Query></View>", "Id": "85907fb0-cda1-43ec-832e-27118c89cf9f", "ImageUrl": "/_layouts/15/images/dlicon.png?rev=45", "IncludeRootFolder": false, "ViewJoins": null, "JSLink": "clienttemplates.js", "ListViewXml": "<View Name=\"{85907FB0-CDA1-43EC-832E-27118C89CF9F}\" DefaultView=\"TRUE\" MobileView=\"TRUE\" MobileDefaultView=\"TRUE\" Type=\"HTML\" DisplayName=\"All Documents\" Url=\"/sites/ninja/Shared Documents/Forms/AllItems.aspx\" Level=\"1\" BaseViewID=\"1\" ContentTypeID=\"0x\" ImageUrl=\"/_layouts/15/images/dlicon.png?rev=45\" ><Query><OrderBy><FieldRef Name=\"FileLeafRef\" /></OrderBy></Query><ViewFields><FieldRef Name=\"DocIcon\" /><FieldRef Name=\"LinkFilename\" /><FieldRef Name=\"Modified\" /><FieldRef Name=\"Editor\" /></ViewFields><RowLimit Paged=\"TRUE\">30</RowLimit><JSLink>clienttemplates.js</JSLink><XslLink Default=\"TRUE\">main.xsl</XslLink><Toolbar Type=\"Standard\"/></View>", "Method": null, "MobileDefaultView": true, "MobileView": true, "ModerationType": null, "NewDocumentTemplates": null, "OrderedView": false, "Paged": true, "PersonalView": false, "ViewProjectedFields": null, "ViewQuery": "<OrderBy><FieldRef Name=\"FileLeafRef\" /></OrderBy>", "ReadOnlyView": false, "RequiresClientIntegration": false, "RowLimit": 30, "Scope": 0, "ServerRelativePath": { "DecodedUrl": "/sites/ninja/Shared Documents/Forms/AllItems.aspx" }, "ServerRelativeUrl": "/sites/ninja/Shared Documents/Forms/AllItems.aspx", "StyleId": null, "TabularView": true, "Threaded": false, "Title": "All Documents", "Toolbar": "", "ToolbarTemplateName": null, "ViewType": "HTML", "ViewData": null, "VisualizationInfo": null }, { "Aggregations": null, "AggregationsStatus": null, "BaseViewId": "9", "ColumnWidth": null, "ContentTypeId": { "StringValue": "0x" }, "CustomFormatter": null, "DefaultView": false, "DefaultViewForContentType": false, "EditorModified": false, "Formats": null, "Hidden": true, "HtmlSchemaXml": "<View Name=\"{281E80FD-099B-4EBA-B622-A94FA03BF865}\" Type=\"HTML\" Hidden=\"TRUE\" TabularView=\"FALSE\" DisplayName=\"Relink Documents\" Url=\"/sites/ninja/Shared Documents/Forms/repair.aspx\" Level=\"1\" BaseViewID=\"9\" ContentTypeID=\"0x\" ToolbarTemplate=\"RelinkToolBar\" ImageUrl=\"/_layouts/15/images/dlicon.png?rev=45\"><XslLink Default=\"TRUE\">main.xsl</XslLink><RowLimit Paged=\"TRUE\">30</RowLimit><Toolbar Type=\"Standard\" /><ViewFields><FieldRef Name=\"DocIcon\" /><FieldRef Name=\"LinkFilenameNoMenu\" /><FieldRef Name=\"RepairDocument\" /><FieldRef Name=\"Modified\" /><FieldRef Name=\"Editor\" /><FieldRef Name=\"ContentType\" /><FieldRef Name=\"TemplateUrl\" /></ViewFields><ParameterBindings><ParameterBinding Name=\"NoAnnouncements\" Location=\"Resource(wss,noitemsinview_doclibrary)\" /><ParameterBinding Name=\"NoAnnouncementsHowTo\" Location=\"Resource(wss,noitemsinview_doclibrary_howto2)\" /></ParameterBindings><Query><OrderBy><FieldRef Name=\"FileLeafRef\" /></OrderBy><Where><Neq><FieldRef Name=\"xd_Signature\" /><Value Type=\"Boolean\">1</Value></Neq></Where></Query></View>", "Id": "281e80fd-099b-4eba-b622-a94fa03bf865", "ImageUrl": "/_layouts/15/images/dlicon.png?rev=45", "IncludeRootFolder": false, "ViewJoins": null, "JSLink": null, "ListViewXml": "<View Name=\"{281E80FD-099B-4EBA-B622-A94FA03BF865}\" Type=\"HTML\" Hidden=\"TRUE\" TabularView=\"FALSE\" DisplayName=\"Relink Documents\" Url=\"/sites/ninja/Shared Documents/Forms/repair.aspx\" Level=\"1\" BaseViewID=\"9\" ContentTypeID=\"0x\" ToolbarTemplate=\"RelinkToolBar\" ImageUrl=\"/_layouts/15/images/dlicon.png?rev=45\" ><Query><OrderBy><FieldRef Name=\"FileLeafRef\" /></OrderBy><Where><Neq><FieldRef Name=\"xd_Signature\" /><Value Type=\"Boolean\">1</Value></Neq></Where></Query><ViewFields><FieldRef Name=\"DocIcon\" /><FieldRef Name=\"LinkFilenameNoMenu\" /><FieldRef Name=\"RepairDocument\" /><FieldRef Name=\"Modified\" /><FieldRef Name=\"Editor\"/><FieldRef Name=\"ContentType\" /><FieldRef Name=\"TemplateUrl\" /></ViewFields><RowLimit Paged=\"TRUE\">30</RowLimit><XslLink Default=\"TRUE\">main.xsl</XslLink><Toolbar Type=\"Standard\"/></View>", "Method": null, "MobileDefaultView": false, "MobileView": false, "ModerationType": null, "NewDocumentTemplates": null, "OrderedView": false, "Paged": true, "PersonalView": false, "ViewProjectedFields": null, "ViewQuery": "<OrderBy><FieldRef Name=\"FileLeafRef\" /></OrderBy><Where><Neq><FieldRef Name=\"xd_Signature\" /><Value Type=\"Boolean\">1</Value></Neq></Where>", "ReadOnlyView": false, "RequiresClientIntegration": false, "RowLimit": 30, "Scope": 0, "ServerRelativePath": { "DecodedUrl": "/sites/ninja/Shared Documents/Forms/repair.aspx" }, "ServerRelativeUrl": "/sites/ninja/Shared Documents/Forms/repair.aspx", "StyleId": null, "TabularView": false, "Threaded": false, "Title": "Relink Documents", "Toolbar": "", "ToolbarTemplateName": "RelinkToolBar", "ViewType": "HTML", "ViewData": null, "VisualizationInfo": null }, { "Aggregations": null, "AggregationsStatus": null, "BaseViewId": "40", "ColumnWidth": null, "ContentTypeId": { "StringValue": "0x" }, "CustomFormatter": null, "DefaultView": false, "DefaultViewForContentType": false, "EditorModified": false, "Formats": null, "Hidden": true, "HtmlSchemaXml": "<View Name=\"{3D760127-982C-405E-9C93-E1F76E1A1110}\" Type=\"HTML\" Hidden=\"TRUE\" DisplayName=\"assetLibTemp\" Url=\"/sites/ninja/Shared Documents/Forms/Thumbnails.aspx\" Level=\"1\" BaseViewID=\"40\" ContentTypeID=\"0x\" ImageUrl=\"/_layouts/15/images/dlicon.png?rev=45\"><ViewFields><FieldRef Name=\"LinkFilename\" /></ViewFields><RowLimit>20</RowLimit><Query><OrderBy><FieldRef Name=\"LinkFilename\" /></OrderBy></Query></View>", "Id": "3d760127-982c-405e-9c93-e1f76e1a1110", "ImageUrl": "/_layouts/15/images/dlicon.png?rev=45", "IncludeRootFolder": false, "ViewJoins": null, "JSLink": null, "ListViewXml": "<View Name=\"{3D760127-982C-405E-9C93-E1F76E1A1110}\" Type=\"HTML\" Hidden=\"TRUE\" DisplayName=\"assetLibTemp\" Url=\"/sites/ninja/SharedDocuments/Forms/Thumbnails.aspx\" Level=\"1\" BaseViewID=\"40\" ContentTypeID=\"0x\" ImageUrl=\"/_layouts/15/images/dlicon.png?rev=45\" ><Query><OrderBy><FieldRef Name=\"LinkFilename\" /></OrderBy></Query><ViewFields><FieldRef Name=\"LinkFilename\" /></ViewFields><RowLimit>20</RowLimit><Toolbar Type=\"None\"/></View>", "Method": null, "MobileDefaultView": false, "MobileView": false, "ModerationType": null, "NewDocumentTemplates": null, "OrderedView": false, "Paged": false, "PersonalView": false, "ViewProjectedFields": null, "ViewQuery": "<OrderBy><FieldRef Name=\"LinkFilename\" /></OrderBy>", "ReadOnlyView": false, "RequiresClientIntegration": false, "RowLimit": 20, "Scope": 0, "ServerRelativePath": { "DecodedUrl": "/sites/ninja/Shared Documents/Forms/Thumbnails.aspx" }, "ServerRelativeUrl": "/sites/ninja/Shared Documents/Forms/Thumbnails.aspx", "StyleId": null, "TabularView": true, "Threaded": false, "Title": "assetLibTemp", "Toolbar": null, "ToolbarTemplateName": null, "ViewType": "HTML", "ViewData": null, "VisualizationInfo": null }, { "Aggregations": null, "AggregationsStatus": null, "BaseViewId": "7", "ColumnWidth": null, "ContentTypeId": { "StringValue": "0x" }, "CustomFormatter": null, "DefaultView": false, "DefaultViewForContentType": false, "EditorModified": false, "Formats": null, "Hidden": true, "HtmlSchemaXml": "<View Name=\"{1204C10A-978D-46C8-A6F2-65ECFA5E03D5}\" Type=\"HTML\" Hidden=\"TRUE\" TabularView=\"FALSE\" AggregateView=\"TRUE\" DisplayName=\"Merge Documents\" Url=\"/sites/ninja/Shared Documents/Forms/Combine.aspx\" Level=\"1\" BaseViewID=\"7\" ContentTypeID=\"0x\" ToolbarTemplate=\"MergeToolBar\" ImageUrl=\"/_layouts/15/images/dlicon.png?rev=45\"><XslLink Default=\"TRUE\">main.xsl</XslLink><JSLink>clienttemplates.js</JSLink><RowLimit Paged=\"TRUE\">30</RowLimit><Toolbar Type=\"Standard\" /><ViewFields><FieldRef Name=\"DocIcon\" /><FieldRef Name=\"LinkFilename\" /><FieldRef Name=\"Combine\" /><FieldRef Name=\"Modified\" /><FieldRef Name=\"Editor\" /></ViewFields><ParameterBindings><ParameterBinding Name=\"NoAnnouncements\" Location=\"Resource(wss,noitemsinview_doclibrary)\" /><ParameterBinding Name=\"NoAnnouncementsHowTo\" Location=\"Resource(wss,noitemsinview_doclibrary_howto2)\" /></ParameterBindings><Query><OrderBy><FieldRef Name=\"FileLeafRef\" /></OrderBy></Query></View>", "Id": "1204c10a-978d-46c8-a6f2-65ecfa5e03d5", "ImageUrl": "/_layouts/15/images/dlicon.png?rev=45", "IncludeRootFolder": false, "ViewJoins": null, "JSLink": "clienttemplates.js", "ListViewXml": "<View Name=\"{1204C10A-978D-46C8-A6F2-65ECFA5E03D5}\" Type=\"HTML\" Hidden=\"TRUE\" TabularView=\"FALSE\" AggregateView=\"TRUE\" DisplayName=\"Merge Documents\" Url=\"/sites/ninja/Shared Documents/Forms/Combine.aspx\" Level=\"1\" BaseViewID=\"7\" ContentTypeID=\"0x\" ToolbarTemplate=\"MergeToolBar\" ImageUrl=\"/_layouts/15/images/dlicon.png?rev=45\" ><Query><OrderBy><FieldRef Name=\"FileLeafRef\" /></OrderBy></Query><ViewFields><FieldRef Name=\"DocIcon\" /><FieldRef Name=\"LinkFilename\" /><FieldRef Name=\"Combine\" /><FieldRef Name=\"Modified\" /><FieldRef Name=\"Editor\" /></ViewFields><RowLimit Paged=\"TRUE\">30</RowLimit><JSLink>clienttemplates.js</JSLink><XslLink Default=\"TRUE\">main.xsl</XslLink><Toolbar Type=\"Standard\"/></View>", "Method": null, "MobileDefaultView": false, "MobileView": false, "ModerationType": null, "NewDocumentTemplates": null, "OrderedView": false, "Paged": true, "PersonalView": false, "ViewProjectedFields": null, "ViewQuery": "<OrderBy><FieldRef Name=\"FileLeafRef\" /></OrderBy>", "ReadOnlyView": false, "RequiresClientIntegration": false, "RowLimit": 30, "Scope": 0, "ServerRelativePath": { "DecodedUrl": "/sites/ninja/Shared Documents/Forms/Combine.aspx" }, "ServerRelativeUrl": "/sites/ninja/Shared Documents/Forms/Combine.aspx", "StyleId": null, "TabularView": false, "Threaded": false, "Title": "Merge Documents", "Toolbar": "", "ToolbarTemplateName": "MergeToolBar", "ViewType": "HTML", "ViewData": null, "VisualizationInfo": null }, { "Aggregations": null, "AggregationsStatus": null, "BaseViewId": "50", "ColumnWidth": null, "ContentTypeId": { "StringValue": "0x" }, "CustomFormatter": null, "DefaultView": false, "DefaultViewForContentType": false, "EditorModified": false, "Formats": null, "Hidden": true, "HtmlSchemaXml": "<View Name=\"{E021E923-0801-4A16-9775-545239356739}\" MobileView=\"TRUE\" Type=\"HTML\" Hidden=\"TRUE\" DisplayName=\"\" Url=\"/sites/ninja/SitePages/Home.aspx\" Level=\"1\" BaseViewID=\"50\" ContentTypeID=\"0x\"><XslLink Default=\"TRUE\">main.xsl</XslLink><JSLink>clienttemplates.js</JSLink><RowLimit Paged=\"TRUE\">15</RowLimit><Toolbar Type=\"Standard\" /><ViewFields><FieldRef Name=\"DocIcon\" /><FieldRef Name=\"LinkFilename\" /></ViewFields><ParameterBindings><ParameterBinding Name=\"NoAnnouncements\" Location=\"Resource(wss,noitemsinview_doclibrary)\" /><ParameterBinding Name=\"NoAnnouncementsHowTo\" Location=\"Resource(wss,noitemsinview_doclibrary_howto2)\" /></ParameterBindings><Query><OrderBy><FieldRef Name=\"Modified\" Ascending=\"FALSE\" /></OrderBy></Query></View>", "Id": "e021e923-0801-4a16-9775-545239356739", "ImageUrl": null, "IncludeRootFolder": false, "ViewJoins": null, "JSLink": "clienttemplates.js", "ListViewXml": "<View Name=\"{E021E923-0801-4A16-9775-545239356739}\" MobileView=\"TRUE\" Type=\"HTML\"Hidden=\"TRUE\" DisplayName=\"\" Url=\"/sites/ninja/SitePages/Home.aspx\" Level=\"1\" BaseViewID=\"50\" ContentTypeID=\"0x\" ><Query><OrderBy><FieldRef Name=\"Modified\" Ascending=\"FALSE\" /></OrderBy></Query><ViewFields><FieldRef Name=\"DocIcon\" /><FieldRef Name=\"LinkFilename\" /></ViewFields><RowLimit Paged=\"TRUE\">15</RowLimit><JSLink>clienttemplates.js</JSLink><XslLink Default=\"TRUE\">main.xsl</XslLink><Toolbar Type=\"Standard\"/></View>", "Method": null, "MobileDefaultView": false, "MobileView": true, "ModerationType": null, "NewDocumentTemplates": null, "OrderedView": false, "Paged": true, "PersonalView": false, "ViewProjectedFields": null, "ViewQuery": "<OrderBy><FieldRef Name=\"Modified\" Ascending=\"FALSE\" /></OrderBy>", "ReadOnlyView": false, "RequiresClientIntegration": false, "RowLimit": 15, "Scope": 0, "ServerRelativePath": { "DecodedUrl": "/sites/ninja/SitePages/Home.aspx" }, "ServerRelativeUrl": "/sites/ninja/SitePages/Home.aspx", "StyleId": null, "TabularView": true, "Threaded": false, "Title": "", "Toolbar": "", "ToolbarTemplateName": null, "ViewType": "HTML", "ViewData": null, "VisualizationInfo": null }]));
        done();
      }
      catch (e) {
        done(e);
      }
    });
  });

  it('command correctly handles list get reject request', (done) => {
    sinon.stub(request, 'post').callsFake((opts) => {
      if (opts.url.indexOf('/_api/contextinfo') > -1) {
        return Promise.resolve({
          FormDigestValue: 'abc'
        });
      }

      return Promise.reject('Invalid request');
    });

    const err = 'Invalid request';
    sinon.stub(request, 'get').callsFake((opts) => {
      if (opts.url.indexOf('/_api/web/lists/GetByTitle(') > -1) {
        return Promise.reject(err);
      }

      return Promise.reject('Invalid request');
    });

    auth.site = new Site();
    auth.site.connected = true;
    auth.site.url = 'https://contoso.sharepoint.com';
    cmdInstance.action = command.action();

    const actionTitle: string = 'Documents';

    cmdInstance.action({
      options: {
        debug: true,
        listTitle: actionTitle,
        webUrl: 'https://contoso.sharepoint.com'
      }
    }, (error?: any) => {
      try {
        assert.equal(JSON.stringify(error), JSON.stringify(new CommandError(err)));
        done();
      }
      catch (e) {
        done(e);
      }
    });
  });

  it('uses correct API url when listTitle option is passed', (done) => {
    sinon.stub(request, 'get').callsFake((opts) => {
      if (opts.url.indexOf('/_api/web/lists/GetByTitle(') > -1) {
        return Promise.resolve({
          "value": []
        })
      }

      return Promise.reject('Invalid request');
    });

    auth.site = new Site();
    auth.site.connected = true;
    auth.site.url = 'https://contoso.sharepoint.com';
    cmdInstance.action = command.action();

    const actionTitle: string = 'Documents';

    cmdInstance.action({
      options: {
        debug: false,
        listTitle: actionTitle,
        webUrl: 'https://contoso.sharepoint.com'
      }
    }, () => {

      try {
        assert(1 === 1);
        done();
      }
      catch (e) {
        done(e);
      }
    });
  });

  it('uses correct API url when listId option is passed', (done) => {
    sinon.stub(request, 'get').callsFake((opts) => {
      if (opts.url.indexOf('/_api/web/lists(guid') > -1) {
        return Promise.resolve({
          "value": []
        })
      }

      return Promise.reject('Invalid request');
    });

    auth.site = new Site();
    auth.site.connected = true;
    auth.site.url = 'https://contoso.sharepoint.com';
    cmdInstance.action = command.action();

    const actionId: string = '1f187321-f086-4d3d-8523-517e94cc9df9';

    cmdInstance.action({
      options: {
        debug: false,
        listId: actionId,
        webUrl: 'https://contoso.sharepoint.com'
      }
    }, () => {

      try {
        assert(1 === 1);
        done();
      }
      catch (e) {
        done(e);
      }
    });
  });

  it('fails validation if the webUrl option not specified', () => {
    const actual = (command.validate() as CommandValidate)({ options: { listId: '1f187321-f086-4d3d-8523-517e94cc9df9' } });
    assert.notEqual(actual, true);
  });

  it('fails validation if both listId and listTitle options are not passed', () => {
    const actual = (command.validate() as CommandValidate)({ options: { webUrl: 'https://contoso.sharepoint.com' } });
    assert.notEqual(actual, true);
  });

  it('fails validation if the webUrl option is not a valid SharePoint site URL', () => {
    const actual = (command.validate() as CommandValidate)({ options: { webUrl: 'foo', listId: '1f187321-f086-4d3d-8523-517e94cc9df9' } });
    assert.notEqual(actual, true);
  });

  it('passes validation if the webUrl option is a valid SharePoint site URL', () => {
    const actual = (command.validate() as CommandValidate)({ options: { webUrl: 'https://contoso.sharepoint.com', listId: '1f187321-f086-4d3d-8523-517e94cc9df9' } });
    assert(actual);
  });

  it('fails validation if the listId option is not a valid GUID', () => {
    const actual = (command.validate() as CommandValidate)({ options: { webUrl: 'https://contoso.sharepoint.com', listId: '12345' } });
    assert.notEqual(actual, true);
  });

  it('passes validation if the listId option is a valid GUID', () => {
    const actual = (command.validate() as CommandValidate)({ options: { webUrl: 'https://contoso.sharepoint.com', listId: '1f187321-f086-4d3d-8523-517e94cc9df9' } });
    assert(actual);
  });

  it('fails validation if both listId and listTitle options are passed', () => {
    const actual = (command.validate() as CommandValidate)({ options: { webUrl: 'https://contoso.sharepoint.com', listId: '1f187321-f086-4d3d-8523-517e94cc9df9', listTitle: 'Documents' } });
    assert.notEqual(actual, true);
  });

  it('supports debug mode', () => {
    const options = (command.options() as CommandOption[]);
    let containsDebugOption = false;
    options.forEach(o => {
      if (o.option === '--debug') {
        containsDebugOption = true;
      }
    });
    assert(containsDebugOption);
  });

  it('has help referring to the right command', () => {
    const cmd: any = {
      log: (msg: string) => { },
      prompt: () => { },
      helpInformation: () => { }
    };
    const find = sinon.stub(vorpal, 'find').callsFake(() => cmd);
    cmd.help = command.help();
    cmd.help({}, () => { });
    assert(find.calledWith(commands.LIST_VIEW_LIST));
  });

  it('has help with examples', () => {
    const _log: string[] = [];
    const cmd: any = {
      log: (msg: string) => {
        _log.push(msg);
      },
      prompt: () => { },
      helpInformation: () => { }
    };
    sinon.stub(vorpal, 'find').callsFake(() => cmd);
    cmd.help = command.help();
    cmd.help({}, () => { });
    let containsExamples: boolean = false;
    _log.forEach(l => {
      if (l && l.indexOf('Examples:') > -1) {
        containsExamples = true;
      }
    });
    Utils.restore(vorpal.find);
    assert(containsExamples);
  });

  it('correctly handles lack of valid access token', (done) => {
    Utils.restore(auth.getAccessToken);
    sinon.stub(auth, 'getAccessToken').callsFake(() => { return Promise.reject(new Error('Error getting access token')); });
    auth.site = new Site();
    auth.site.connected = true;
    auth.site.url = 'https://contoso.sharepoint.com';
    cmdInstance.action = command.action();
    cmdInstance.action({
      options: {
        listId: "1f187321-f086-4d3d-8523-517e94cc9df9",
        webUrl: "https://contoso.sharepoint.com",
        debug: false
      }
    }, (err?: any) => {
      try {
        assert.equal(JSON.stringify(err), JSON.stringify(new CommandError('Error getting access token')));
        done();
      }
      catch (e) {
        done(e);
      }
    });
  });
});