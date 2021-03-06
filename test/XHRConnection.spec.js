import {$Connection} from '../src/XHRConnection';
import {assert} from 'assert';
import {IConnection} from '../src/IConnection';
import {inject} from 'di/testing';
import {PromiseBackend, PromiseMock} from 'deferred/PromiseMock';

describe('$Connection', function() {
  it('should implement IConnection', function() {
    assert.type($Connection, IConnection);
  });

  describe('constructor', function() {
    it('should create a promise for the connection', function() {
      var connection = new $Connection();
      expect(connection.promise instanceof Promise).toBe(true);
    });
  });


  describe('.open()', function() {
    it('should complain if no method provided', function() {
      var connection = new $Connection();
      expect(function() {
        connection.open(undefined, '/users');
      }).toThrow();
    });

    it('should complain if provided method is not a string', function() {
      expect(function() {
        var connection = new $Connection();
        connection.open(undefined, '/users');
      }).toThrow();
      expect(function() {
        var connection = new $Connection();
        connection.open('GET', '/users');
      }).not.toThrow();
    });


    it('should set the method to the instance', function() {
      var connection = new $Connection();
      connection.open('GET', '/users');
      expect(connection.method).toBe('GET');
    });


    it('should complain if invalid url type provided', function() {
      expect(function() {
        var connection = new $Connection();
        connection.open('GET', undefined);
      }).toThrow();
      expect(function() {
        var connection = new $Connection();
        connection.open('GET', '/users');
      }).not.toThrow();
    });


    it('should set the url to the instance', function () {
      var connection = new $Connection();
      connection.open('GET', '/items');
      expect(connection.url).toBe('/items');
    });


    it('should complain if open is called more than once', function() {
      var connection = new $Connection();
      connection.open('GET', '/items');
      expect(function() {
        connection.open('GET', '/items');
      }).toThrow();
    });
  });


  describe('.send()', function() {
    it('should add load and error event listeners', function() {
      var listenerSpy = spyOn(XMLHttpRequest.prototype, 'addEventListener');
      var connection = new $Connection();
      connection.open('GET', '/items');
      expect(listenerSpy).not.toHaveBeenCalled();
      connection.send();
      expect(listenerSpy.calls.all()[1].args[0]).toBe('error');
      expect(listenerSpy.calls.all()[0].args[0]).toBe('load');
    });


    it('should complain if the connection has not been opened', function() {

    });


    it('should accept no data', function() {
      var spy = spyOn(XMLHttpRequest.prototype, 'send');
      var connection = new $Connection();
      connection.open('POST', '/assets');
      connection.send();
      expect(spy).toHaveBeenCalled();
    });


    it('should accept DataView data', function() {
      var spy = spyOn(XMLHttpRequest.prototype, 'send');
      var buffer = new ArrayBuffer();
      var view = new DataView(buffer);
      var connection = new $Connection();
      connection.open('POST', '/assets');
      connection.send(view);
      expect(spy).toHaveBeenCalledWith(view);
    });


    it('should accept Blob data', function() {
      var spy = spyOn(XMLHttpRequest.prototype, 'send');
      var blob = new Blob();
      var connection = new $Connection();
      connection.open('POST', '/assets');
      connection.send(blob);
      expect(spy).toHaveBeenCalledWith(blob);
    });


    it('should accept Document data', function() {
      var spy = spyOn(XMLHttpRequest.prototype, 'send');
      var connection = new $Connection();
      var doc = document.implementation.createDocument(null, 'doc');
      connection.open('POST', '/assets');
      connection.send(doc);
      expect(spy).toHaveBeenCalledWith(doc);
    });


    it('should accept String data', function() {
      var spy = spyOn(XMLHttpRequest.prototype, 'send');
      var connection = new $Connection();
      var body = 'POST ME!';
      connection.open('POST', '/assets');
      connection.send(body);
      expect(spy).toHaveBeenCalledWith(body);
    });


    it('should accept FormData data', function() {
      var spy = spyOn(XMLHttpRequest.prototype, 'send');
      var connection = new $Connection();
      var formData = new FormData();
      formData.append('user', 'Jeff');
      connection.open('POST', '/assets');
      connection.send(formData);
      expect(spy).toHaveBeenCalledWith(formData);
    });


    it('should complain when given an invalid type of data', function() {
      var connection = new $Connection();
      connection.open('POST', '/assets');
      expect(function() {
        connection.send(5);
      }).toThrow();

    });
  });


  describe('instance', function() {
    it('should be thenable at the instance level', function(){
      var connection = new $Connection();
      expect(typeof connection.then).toBe('function');
    });
  });


  describe('.promise', function() {
    it('should return a promise', function() {
      assert.type(new $Connection().promise, Promise);
    })
  });


  describe('.onLoad_()', function() {
    it('should unregister load and error events', function() {
      var addListenerSpy = spyOn(XMLHttpRequest.prototype, 'addEventListener');
      var removedListenerSpy = spyOn(XMLHttpRequest.prototype, 'removeEventListener');
      var connection = new $Connection();
      connection.open('GET', '/items');
      connection.send();
      expect(addListenerSpy.calls.count()).toBe(2);
      expect(removedListenerSpy).not.toHaveBeenCalled();
      connection.onLoad_({});
      expect(removedListenerSpy.calls.count()).toBe(2);
      expect(removedListenerSpy.calls.all()[0].args[0]).toBe('load');
      expect(removedListenerSpy.calls.all()[1].args[0]).toBe('error');
    });


    it('should resolve the deferred with the responseText', function() {
      var res = 'The time is 12:00pm';
      var connection = new $Connection();
      var resolveSpy = spyOn(connection.deferred, 'resolve');
      connection.xhr_ = {responseText: res, removeEventListener: function(){}};
      connection.onLoad_.call(connection, {});
      expect(resolveSpy).toHaveBeenCalledWith(res);
    });
  });


  describe('.onError_()', function() {
    it('should unregister load and error events', function() {
      var addListenerSpy = spyOn(XMLHttpRequest.prototype, 'addEventListener');
      var removedListenerSpy = spyOn(XMLHttpRequest.prototype, 'removeEventListener');
      var sendSpy = spyOn(XMLHttpRequest.prototype, 'send');
      var connection = new $Connection();
      connection.open('GET', '/items');
      connection.send();
      expect(addListenerSpy.calls.count()).toBe(2);
      expect(removedListenerSpy).not.toHaveBeenCalled();
      connection.onError_({});
      expect(removedListenerSpy.calls.count()).toBe(2);
      expect(removedListenerSpy.calls.all()[0].args[0]).toBe('load');
      expect(removedListenerSpy.calls.all()[1].args[0]).toBe('error');
    });
  });


  describe('.success()', function() {

  });


  describe('.error()', function() {

  });
});
