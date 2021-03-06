/* eslint-disable no-unused-expressions */
const sinon = require("sinon");
const { expect } = require("chai");
const proxyquire = require("proxyquire");

const pgMock = {};
const Db = proxyquire("../lib/db", { pg: pgMock });

describe("lib/db", () => {
  let sandbox;
  const log = () => null;
  let client;

  beforeEach(() => {
    sandbox = sinon.sandbox.create();
    client = {
      end: () => null
    };
    pgMock.Client = sandbox.mock().returns(client);
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe(".constructor( connection_string )", () => {
    let db;
    afterEach(() => {
      if (db) {
        db.close();
      }
    });

    it("pg.Client should be called with connection_string", () => {
      db = Db("connection_string");
      expect(pgMock.Client).to.be.calledWith("connection_string");
    });
  });

  describe(".query( query )", () => {
    let db;
    beforeEach(() => {
      db = Db(undefined, log);
      client.connect = sandbox.stub();
      client.query = sandbox.stub();
    });
    afterEach(() => {
      db.close();
    });

    it("should call client.connect if this is the first query", () => {
      client.connect.callsFake(fn => fn());
      client.query.returns(Promise.resolve());
      return db.query("query").then(() => {
        expect(client.connect).to.be.calledOnce;
      });
    });
    it("should not call client.connect on subsequent queries", () => {
      client.connect.callsFake(fn => fn());
      client.query.returns(Promise.resolve());
      return db
        .query("query_one")
        .then(() => db.query("query_two"))
        .then(() => {
          expect(client.connect).to.be.calledOnce;
        });
    });
    it("should call client.query with query", () => {
      client.connect.callsFake(fn => fn());
      client.query.returns(Promise.resolve());
      return db.query("query").then(() => {
        expect(client.query.getCall(0).args[0]).to.equal("query");
      });
    });
    it("should not call client.query if client.connect fails", () => {
      const error = "error";
      client.connect.callsFake(fn => fn(error));
      return expect(db.query("query"))
        .to.eventually.be.rejectedWith(error)
        .then(() => expect(client.query).to.not.been.called);
    });
    it("should resolve promise if query throws no error", () => {
      client.connect.callsFake(fn => fn());
      const result = "result";
      client.query.returns(Promise.resolve(result));
      return expect(db.query("query")).to.eventually.equal(result);
    });
    it("should reject promise if query throws error", () => {
      client.connect.callsFake(fn => fn());
      const error = "error";
      client.query.returns(Promise.reject(error));
      return expect(db.query("query")).to.eventually.be.rejectedWith(error);
    });
  });

  describe(".close()", () => {
    let db;
    beforeEach(() => {
      db = Db();
    });
    afterEach(() => {
      db.close();
    });

    it("should call client.end", () => {
      client.end = sinon.spy();
      return db.close().then(() => expect(client.end).to.be.calledOnce);
    });
  });
});
