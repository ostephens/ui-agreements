/* global describe, it, before, after, Nightmare */
const AgreementCRUD = require('./agreement-crud');

module.exports.test = (uiTestCtx) => {
  const number = Math.round(Math.random() * 100000);
  const testTag = `test${Math.floor(Math.random() * 10000)}`;
  const agreement = {
    name: `Tags Agreement #${number}`,
  };

  describe('Login > Enable Tags > Find user > Create Tags > Logout\n', function test() {
    const { config, helpers } = uiTestCtx;
    const nightmare = new Nightmare(config.nightmare);
    nightmare.options.width = 1000; // added this temporarily as MultiSelect doesnt work well with narrow screen sizes

    this.timeout(Number(config.test_timeout));

    describe('login > create license > edit terms > create agreement > link license > check term > logout', () => {
      before((done) => {
        helpers.login(nightmare, config, done);
      });

      after((done) => {
        helpers.logout(nightmare, config, done);
      });

      it('should Enable tags in settings', done => {
        nightmare
          .wait(config.select.settings)
          .click(config.select.settings)
          .wait('#app-list-item-clickable-settings')
          .wait('a[href="/settings/tags"]')
          .click('a[href="/settings/tags"]')
          .wait('a[href="/settings/tags/general"]')
          .click('a[href="/settings/tags/general"]')
          .wait('#tags_enabled')
          .wait(222)
          .evaluate(() => {
            const list = document.querySelectorAll('[value="true"]');
            list.forEach(el => (el.click()));
          })
          .then(() => {
            nightmare
              .wait(222)
              .wait('#tags_enabled')
              .click('#tags_enabled')
              .wait('#clickable-save-config')
              .click('#clickable-save-config')
              .then(done)
              .catch(done);
          });
      });

      it('should open Agreements app', done => {
        helpers.clickApp(nightmare, done, 'agreements');
      });

      it('should confirm correct URL', done => {
        nightmare
          .evaluate(() => document.location.pathname)
          .then(pathName => {
            if (!pathName.includes('/erm/agreements')) throw Error('URL is incorrect');
            done();
          })
          .catch(done);
      });

      it('should create agreement', done => {
        AgreementCRUD.createAgreement(nightmare, done, agreement);
      });

      it('should add a new Tag', done => {
        nightmare
          .wait('#clickable-show-tags')
          .click('#clickable-show-tags')
          .wait('#input-tag-input')
          .type('#input-tag-input', testTag)
          .click('#input-tag-input')
          .type('#input-tag-input', '\u000d')
          .wait((tagValue) => {
            return Array.from(
              document.querySelectorAll('div[class*="valueChipValue"]')
            ).findIndex(e => e.textContent === tagValue) >= 0;
          }, testTag)
          .then(done)
          .catch(done);
      });

      it('should have the badge count equal to 1', done => {
        nightmare
          .wait('#clickable-show-tags')
          .wait(() => parseInt(document.querySelector('#clickable-show-tags').textContent) === 1)
          .then(done)
          .catch(done);
      });
    });
  });
};
