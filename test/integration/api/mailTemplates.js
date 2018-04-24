var request               = require('supertest');
var chai                  = require('chai');
var expect                = chai.expect;
var BOFactory             = require('../../../src/business/boFactory');

describe('api', function(){
  var server = null;
  var userBO = BOFactory.getBO('user');
  var mailTemplateBO = BOFactory.getBO('mailTemplate');

  var adminUser = {
    name: 'Admin User',
    email: 'admin@gmail.com',
    password: '123456',
    role: 'admin',
    confirmation: {
      key: '1'
    },
    internalKey: '1'
  };

  var user = {
    name: 'User',
    email: 'user@gmail.com',
    password: '123456',
    role: 'user',
    confirmation: {
      key: '1'
    },
    internalKey: '1'
  };

  var connectionInfo = {
    ip: 'fake',
    userAgent: 'fake'
  };

  before(function(){
    server = require('../../../src/server');
    var chain = Promise.resolve();

    //before start the tests it is necessary create an admin user, simple user
    // and get the tokens for each one of them
    return chain
      .then(function() {
        return userBO.clear();
      })
      .then(function() {
        return userBO.createUserWithoutValidations(adminUser);
      })
      .then(function(r) {
        adminUser.id = r.id;
        return userBO.generateToken(adminUser.email, adminUser.password, null, connectionInfo);
      })
      .then(function(r) {
        adminUser.token = r.token;
        return userBO.createUserWithoutValidations(user);
      })
      .then(function(r) {
        user.id = r.id;
        return userBO.generateToken(user.email, user.password, null, connectionInfo);
      })
      .then(function(r) {
        user.token = r.token;
        return mailTemplateBO.clear();
      });
  });

  after(function(){
    var chain = Promise.resolve();

    return chain
      .then(function() {
        return userBO.clear();
      })
      .then(function() {
        return mailTemplateBO.clear();
      });
  });

  describe('/v1/mail-templates', function(){
    describe('basic token validation', function(){
      it('should fail to perform GET to the route /mail-templates without a token (403)', function() {
        return request(server)
          .get('/v1/mail-templates')
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(403);
      });

      it('should fail to perform POST to the route /mail-templates without a token (403)', function() {
        return request(server)
          .post('/v1/mail-templates')
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(403);
      });

      it('should fail to perform GET the route /mail-templates without a token (404)', function() {
        return request(server)
          .get('/v1/mail-templates/fake-id')
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(403);
      });

      it('should fail to perform DELETE to the route /mail-templates/id without a token (403)', function() {
        return request(server)
          .delete('/v1/mail-templates/fake-id')
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(403);
      });
    });

    it('should list mail templates with a valid token', function() {
      return request(server)
        .get('/v1/mail-templates')
        .set('Accept', 'application/json')
        .set('Authorization', 'Bearer ' + adminUser.token)
        .expect('Content-Type', /json/)
        .expect(200);
    });

    it('should store a new mail template', function() {
      var entityId = null;

      return request(server)
        .post('/v1/mail-templates')
        .send({
            key: 'key',
            from: 'from',
            subject: 'subject',
            textTemplate: 'textTemplate',
            htmlTemplate: 'htmlTemplate'
          })
        .set('Accept', 'application/json')
        .set('Authorization', 'Bearer ' + adminUser.token)
        .expect('Content-Type', /json/)
        .expect(201)
        .then(function(res) {
          expect(res.body).to.have.property('id');
          expect(res.body.from).to.be.equal('from');
          expect(res.body.subject).to.be.equal('subject');
          expect(res.body.textTemplate).to.be.equal('textTemplate');
          expect(res.body.htmlTemplate).to.be.equal('htmlTemplate');

          return res.body.id;
        })
        .then(function(id) {
          entityId = id;
          return request(server)
            .get('/v1/mail-templates')
            .set('Accept', 'application/json')
            .set('Authorization', 'Bearer ' + adminUser.token)
            .expect('Content-Type', /json/)
            .expect(200);
        })
        .then(function(res) {
          expect(res.body).to.be.an('array');
          expect(res.body).to.have.lengthOf(1);
          expect(res.body[0].id).to.be.equal(entityId);
        });
    });

    it('should fail to store a new mail template using a regular user token', function() {
      return request(server)
        .post('/v1/mail-templates')
        .send({})
        .set('Accept', 'application/json')
        .set('Authorization', 'Bearer ' + user.token)
        .expect('Content-Type', /json/)
        .expect(401);
    });

    it('should update a mail template', function() {
      var entityId = null;

      return request(server)
        .get('/v1/mail-templates')
        .set('Accept', 'application/json')
        .set('Authorization', 'Bearer ' + adminUser.token)
        .expect('Content-Type', /json/)
        .expect(200)
        .then(function(res) {
          entityId = res.body[0].id;
          return request(server)
            .put('/v1/mail-templates/' + entityId)
            .send({
              from: 'new from'
            })
            .set('Accept', 'application/json')
            .set('Authorization', 'Bearer ' + adminUser.token)
            .expect('Content-Type', /json/)
            .expect(200);
        })
        .then(function(res) {
          expect(res.body.id).to.be.equal(entityId);
          expect(res.body.from).to.be.equal('new from');
          expect(res.body.subject).to.be.equal('subject');
          expect(res.body.textTemplate).to.be.equal('textTemplate');
          expect(res.body.htmlTemplate).to.be.equal('htmlTemplate');
        });
    });

    it('should fail to update a mail template using a regular user token', function() {
      return request(server)
        .put('/v1/mail-templates/fake-id')
        .send({})
        .set('Accept', 'application/json')
        .set('Authorization', 'Bearer ' + user.token)
        .expect('Content-Type', /json/)
        .expect(401);
    });

    it('should fail to disable a mail template with a regular user token', function() {
      return request(server)
        .delete('/v1/mail-templates/fake-id')
        .set('Accept', 'application/json')
        .set('Authorization', 'Bearer ' + user.token)
        .expect('Content-Type', /json/)
        .expect(401);
    });

    it('should disable a mail template with a admin user token', function() {
      var entityId = null;

      return request(server)
        .get('/v1/mail-templates')
        .set('Accept', 'application/json')
        .set('Authorization', 'Bearer ' + adminUser.token)
        .expect('Content-Type', /json/)
        .expect(200)
        .then(function(res) {
          entityId = res.body[0].id;
          return request(server)
            .delete('/v1/mail-templates/' + entityId)
            .set('Accept', 'application/json')
            .set('Authorization', 'Bearer ' + adminUser.token)
            .expect('Content-Type', /json/)
            .expect(200);
        })
        .then(function() {
          return request(server)
            .get('/v1/mail-templates/' + entityId)
            .set('Accept', 'application/json')
            .set('Authorization', 'Bearer ' + adminUser.token)
            .expect('Content-Type', /json/)
            .expect(404);
        });
    });
  });
});
