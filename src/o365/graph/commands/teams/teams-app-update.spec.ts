import * as sinon from 'sinon';
import * as assert from 'assert';
import request from '../../../../request';
import * as fs from 'fs';
import commands from '../../commands';
import Command, { CommandOption, CommandError, CommandValidate } from '../../../../Command';
import appInsights from '../../../../appInsights';
import auth from '../../GraphAuth';
const command: Command = require('./teams-app-update');
import Utils from '../../../../Utils';
import { Service } from '../../../../Auth';

describe(commands.TEAMS_APP_UPDATE, () => {
  let vorpal: Vorpal;
  let log: string[];
  let cmdInstance: any;
  let cmdInstanceLogSpy: sinon.SinonSpy;
  let trackEvent: any;
  let telemetry: any;

  before(() => {
    sinon.stub(auth, 'restoreAuth').callsFake(() => Promise.resolve());
    sinon.stub(auth, 'ensureAccessToken').callsFake(() => { return Promise.resolve('ABC'); });
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
    auth.service = new Service();
    telemetry = null;
    (command as any).items = [];
  });

  afterEach(() => {
    Utils.restore([
      vorpal.find,
      request.put,
      fs.readFileSync,
      fs.existsSync
    ]);
  });

  after(() => {
    Utils.restore([
      appInsights.trackEvent,
      auth.ensureAccessToken,
      auth.restoreAuth
    ]);
  });

  it('has correct name', () => {
    assert.equal(command.name.startsWith(commands.TEAMS_APP_UPDATE), true);
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
        assert.equal(telemetry.name, commands.TEAMS_APP_UPDATE);
        done();
      }
      catch (e) {
        done(e);
      }
    });
  });

  it('aborts when not logged in to Microsoft Graph', (done) => {
    auth.service = new Service();
    auth.service.connected = false;
    cmdInstance.action = command.action();
    cmdInstance.action({ options: { debug: true } }, (err?: any) => {
      try {
        assert.equal(JSON.stringify(err), JSON.stringify(new CommandError('Log in to the Microsoft Graph first')));
        done();
      }
      catch (e) {
        done(e);
      }
    });
  });

  it('fails validation if the id is not provided.', (done) => {
    const actual = (command.validate() as CommandValidate)({
      options: {
        filePath: 'teamsapp.zip'
      }
    });
    assert.notEqual(actual, true);
    done();
  });

  it('fails validation if the id is not a valid GUID.', (done) => {
    const actual = (command.validate() as CommandValidate)({
      options: {
        id: 'invalid',
        filePath: 'teamsapp.zip'
      }
    });
    assert.notEqual(actual, true);
    done();
  });

  it('fails validation if the filePath is not provided.', (done) => {
    const actual = (command.validate() as CommandValidate)({
      options: {
        id: "e3e29acb-8c79-412b-b746-e6c39ff4cd22"
      }
    });
    assert.notEqual(actual, true);
    done();
  });

  it('fails validation if the filePath does not exist', (done) => {
    sinon.stub(fs, 'existsSync').callsFake(() => false);
    const actual = (command.validate() as CommandValidate)({
      options: { id: "e3e29acb-8c79-412b-b746-e6c39ff4cd22", filePath: 'invalid.zip' }
    });
    assert.notEqual(actual, true);
    done();
  });

  it('fails validation if the filePath points to a directory', (done) => {
    const stats: fs.Stats = new fs.Stats();
    sinon.stub(stats, 'isDirectory').callsFake(() => true);
    sinon.stub(fs, 'existsSync').callsFake(() => true);
    sinon.stub(fs, 'lstatSync').callsFake(() => stats);

    const actual = (command.validate() as CommandValidate)({
      options: { id: "e3e29acb-8c79-412b-b746-e6c39ff4cd22", filePath: './' }
    });
    Utils.restore([
      fs.lstatSync
    ]);
    assert.notEqual(actual, true);
    done();
  });

  it('validates for a correct input.', (done) => {
    const stats: fs.Stats = new fs.Stats();
    sinon.stub(stats, 'isDirectory').callsFake(() => false);
    sinon.stub(fs, 'existsSync').callsFake(() => true);
    sinon.stub(fs, 'lstatSync').callsFake(() => stats);

    const actual = (command.validate() as CommandValidate)({
      options: {
        id: "e3e29acb-8c79-412b-b746-e6c39ff4cd22",
        filePath: 'teamsapp.zip'
      }
    });
    Utils.restore([
      fs.lstatSync
    ]);
    assert.equal(actual, true);
    done();
  });

  it('update Teams app in the tenant app catalog', (done) => {
    let updateTeamsAppCalled = false;
    sinon.stub(request, 'put').callsFake((opts) => {
      if (opts.url === `https://graph.microsoft.com/v1.0/appCatalogs/teamsApps/e3e29acb-8c79-412b-b746-e6c39ff4cd22`) {
        updateTeamsAppCalled = true;
      }
    });

    sinon.stub(fs, 'readFileSync').callsFake(() => '123');

    auth.service = new Service();
    auth.service.connected = true;
    auth.service.resource = 'https://graph.microsoft.com';
    cmdInstance.action = command.action();
    cmdInstance.action({ options: { debug: false, filePath: 'teamsapp.zip', id: `e3e29acb-8c79-412b-b746-e6c39ff4cd22` } }, () => {
      try {
        assert(updateTeamsAppCalled);
        done();
      } catch (e) {
        done(e);
      }
    });
  });

  it('update Teams app in the tenant app catalog (debug)', (done) => {
    let updateTeamsAppCalled = false;
    sinon.stub(request, 'put').callsFake((opts) => {
      if (opts.url === `https://graph.microsoft.com/v1.0/appCatalogs/teamsApps/e3e29acb-8c79-412b-b746-e6c39ff4cd22`) {
        updateTeamsAppCalled = true;
      }
    });

    sinon.stub(fs, 'readFileSync').callsFake(() => '123');

    auth.service = new Service();
    auth.service.connected = true;
    auth.service.resource = 'https://graph.microsoft.com';
    cmdInstance.action = command.action();
    cmdInstance.action({ options: { debug: true, filePath: 'teamsapp.zip', id: `e3e29acb-8c79-412b-b746-e6c39ff4cd22` } }, () => {
      try {
        assert(updateTeamsAppCalled);
        assert(cmdInstanceLogSpy.calledWith(vorpal.chalk.green('DONE')));
        done();
      } catch (e) {
        done(e);
      }
    });
  });

  it('supports debug mode', () => {
    const options = (command.options() as CommandOption[]);
    let containsOption = false;
    options.forEach(o => {
      if (o.option === '--debug') {
        containsOption = true;
      }
    });
    assert(containsOption);
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
    assert(find.calledWith(commands.TEAMS_APP_UPDATE));
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
    Utils.restore(auth.ensureAccessToken);
    sinon.stub(auth, 'ensureAccessToken').callsFake(() => { return Promise.reject(new Error('Error getting access token')); });
    auth.service = new Service();
    auth.service.connected = true;
    auth.service.resource = 'https://graph.microsoft.com';
    cmdInstance.action = command.action();
    cmdInstance.action({ options: { debug: true } }, (err?: any) => {
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