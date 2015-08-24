
// The MIT License (MIT)
// 
// SCORM Data Adapter used to transfer data from application to SCORM-based system
// Copyright (C) 2013-2015 South River Studios
// Version 0.0.2
// 
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
// 
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
// 
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.


var srs = srs || {};
srs.adapter = srs.adapter || {};

srs.adapter.type = 'SCORM';
//srs.adapter.version = '1.2';
//srs.adapter.version = '2004';

switch (srs.adapter.version) {

    case '1.2' :
    
        srs.adapter.properties = {
            STUDENT_NAME : 'cmi.core.student_name',
            STUDENT_ID : 'cmi.core.student_id',
            LOCATION : 'cmi.core.lesson_location',
            STATUS : 'cmi.core.lesson_status',
            SUCCESS : null,
            SUSPEND_DATA : 'cmi.suspend_data',
            SCORE_RAW : 'cmi.core.score.raw',
            SCORE_MIN : 'cmi.core.score.min',
            SCORE_MAX : 'cmi.core.score.max',
            SCORE_SCALED : null,
            CREDIT : 'cmi.core.credit',
            TOTAL_TIME : 'cmi.core.total_time',
            EXIT : 'cmi.core.exit'
        };

        srs.adapter.strings = {
            COMPLETED : 'completed',
            INCOMPLETE : 'incomplete',
            PASSED : 'passed',
            NOT_ATTEMPTED : 'not attempted',
            UNKNOWN : 'unknown',
            EXIT_SUSPEND : 'suspend',
            EXIT_LOGOUT : 'logout'
        };
        
        srs.adapter.methods = {
            INITIALIZE : 'LMSInitialize',
            SET : 'LMSSetValue',
            GET : 'LMSGetValue',
            COMMIT : 'LMSCommit',
            TERMINATE : 'LMSFinish',
             GET_LAST_ERROR : 'LMSGetLastError'
        };
        
        break;

    case '2004' :
    
        srs.adapter.properties = {
            STUDENT_NAME : 'cmi.learner_name',
            STUDENT_ID : 'cmi.learner_id',
            LOCATION : 'cmi.location',
            STATUS : 'cmi.completion_status',
            SUCCESS : 'cmi.success_status',
            SUSPEND_DATA : 'cmi.suspend_data',
            SCORE_RAW : 'cmi.score.raw',
            SCORE_MIN : 'cmi.score.min',
            SCORE_MAX : 'cmi.score.max',
            SCORE_SCALED : 'cmi.score.scaled',
            CREDIT : 'cmi.credit',
            TOTAL_TIME : 'cmi.total_time',
            EXIT : 'cmi.exit'
        };

        srs.adapter.strings = {
            COMPLETED : 'completed',
            INCOMPLETE : 'incomplete',
            PASSED : 'passed',
            NOT_ATTEMPTED : 'not attempted',
            UNKNOWN : 'unknown',
            EXIT_SUSPEND : 'suspend',
            EXIT_LOGOUT : 'normal'
        };
        
        srs.adapter.methods = {
            INITIALIZE : 'Initialize',
            SET : 'SetValue',
            GET : 'GetValue',
            COMMIT : 'Commit',
            TERMINATE : 'Terminate',
             GET_LAST_ERROR : 'GetLastError'
        };

}

srs.adapter.user = function () {
    this.student_name = null;
    this.student_id = null;
    this.location = null;
    this.suspend_data = null;
    this.score_raw = null;
    this.credit = null;
    this.total_time = null;
    this.passing_score = null;
    this.percent_complete = null;
};

srs.adapter.connection = function () {

    return {
        
        _handle: null,
        _found: false,
        initialize: function (callback) {
            this._handle = this.getHandle();
            if (this._handle) {
                this.read(callback);
                var self = this;
                srs.adapter.eventHandler.bind(window, 'unload', function (event) {
                        srs.adapter.eventHandler.unbind(window, 'unload', arguments.callee);
                        self.exit();
                    });
            } else {
                callback(new srs.adapter.user());
            }
        },
        read: function (callback) {
            
            if (this._handle) {

                var success = (this._handle[srs.adapter.methods.INITIALIZE]('') === 'true'); 
            
                if (success) {

                    var user_status = new srs.adapter.user();
                    user_status.student_name = this.getProperty(srs.adapter.properties.STUDENT_NAME);
                    user_status.student_id = this.getProperty(srs.adapter.properties.STUDENT_ID);
                    user_status.location = this.getProperty(srs.adapter.properties.LOCATION);
                    user_status.suspend_data = this.getProperty(srs.adapter.properties.SUSPEND_DATA).split(',');
                    user_status.score_raw = this.getProperty(srs.adapter.properties.SCORE_RAW);
                    user_status.credit = this.getProperty(srs.adapter.properties.CREDIT);
                    user_status.total_time = this.getProperty(srs.adapter.properties.TOTAL_TIME);
                
                     if (this.getProperty(srs.adapter.properties.STATUS) === srs.adapter.strings.NOT_ATTEMPTED || this.getProperty(srs.adapter.properties.STATUS) === srs.adapter.strings.UNKNOWN) {
                        user_status.status = srs.adapter.strings.INCOMPLETE;
                    }

                    callback(user_status);
            
                }
            }
        },
        write: function (user) {
        
            if (this._handle && user) {
                
                var passing_score = user.passing_score,
                    score = user.score_raw || this.getProperty(srs.adapter.properties.SCORE_RAW),
                    percent_complete = user.percent_complete,
                    suspend_data = user.suspend_data,
                    location = user.location,
                    status = null;

                if (passing_score && score && score >= passing_score && percent_complete === 1) {
                    status = srs.adapter.strings.COMPLETED;
                } else if (!passing_score && percent_complete === 1) {
                    status = srs.adapter.strings.COMPLETED;
                } else {
                    status = srs.adapter.strings.INCOMPLETE;
                }
                
                if (score >= passing_score && !this.getProperty(srs.adapter.properties.SCORE_RAW)) {
                    this.setProperty(srs.adapter.properties.SCORE_RAW, score);
                }
                
                this.setProperty(srs.adapter.properties.STATUS, status);
                this.setProperty(srs.adapter.properties.LOCATION, location);
                if (suspend_data && suspend_data.length) {
                    this.setProperty(srs.adapter.properties.SUSPEND_DATA, suspend_data.toString());
                }

                if (srs.adapter.version === '2004' && this.getProperty(srs.adapter.properties.STATUS) === srs.adapter.strings.COMPLETED) {
                    this.setProperty(srs.adapter.properties.SUCCESS, srs.adapter.strings.PASSED);
                }
                if (srs.adapter.version === '2004' && this.getProperty(srs.adapter.properties.SCORE_RAW)) {
                    this.setProperty(srs.adapter.properties.SCORE_SCALED, score/100);
                }
            }
            
        },
        getHandle: function () {
            if(!this._handle && !this._found) {
                this._handle = this.getAPI();
            }
            return this._handle;
        },
        findAPI: function (win) {
            var scorm = null,
                findAttempts = 0,
                findAttemptLimit = 500;
            
            while ((!win.API && !win.API_1484_11) &&
               (win.parent) &&
               (win.parent !== win) &&
               (findAttempts <= findAttemptLimit)) {
                    findAttempts++;
                    win = win.parent;
            }
            
            switch (srs.adapter.version) {
                case '2004':
                    if (win.API_1484_11) {
                        scorm = win.API_1484_11;
                    } else {
                        this.log('SCORM version 2004 was specified by user, but API_1484_11 cannot be found.');
                    }
                    break;
                case '1.2':
                    if (win.API) {
                        scorm = win.API;
                    } else {
                        this.log("SCORM version 1.2 was specified by user, but API cannot be found.");
                    }
                    break;
            }
            
            if (scorm) {
                this.log("API: " + scorm);
            } else {
                this.log("Error finding API. \nFind attempts: " +findAttempts +". \nFind attempt limit: " +findAttemptLimit);
            }
            
            return scorm;
        },
        getAPI: function () {
            var scorm = null;
            if (window.parent && window.parent !== window ) {
                scorm = this.findAPI(window.parent);
            }
            if (!scorm && window.top.opener) {
                scorm = this.findAPI(window.top.opener);
            }
            if (!scorm && window.top.opener && window.top.opener.document) {
                scorm = this.findAPI(window.top.opener.document);
            }
            if (scorm) {
                this._found = true;
            } else {
                this.log("Get API failed: Can't find the API!");
            }
            return scorm;
        },
        setProperty: function ( prop, val ) {
            if (this._handle) {
                this._handle[srs.adapter.methods.SET](prop, val);
            }
        },		
        getProperty: function ( prop ) {
            var value = null;
            if (this._handle) {
                value = this._handle[srs.adapter.methods.GET](prop); 
            }
            return value;
        }, 
        getLastError: function () {
            var code = 0;
            if (this._handle) {
                code = parseInt(this._handle[srs.adapter.methods.GET_LAST_ERROR](), 10);
            } else {
                this.log("SCORM getCode failed: API is null.");
            }
            return code;
        },
        log : function() {
			if (window.console) {
				console.log(Array.prototype.slice.call(arguments));
			}
		},
        terminate: function () {
            this.write();
            var success = false;
            if (this._handle) {
                 if(this.getProperty(srs.adapter.properties.STATUS) !== srs.adapter.strings.COMPLETED && this.getProperty(srs.adapter.properties.STATUS) !== srs.adapter.strings.PASSED) {
                    success = this.setProperty(srs.adapter.properties.EXIT, srs.adapter.strings.EXIT_SUSPEND);
                } else {
                    success = this.setProperty(srs.adapter.properties.EXIT, srs.adapter.strings.EXIT_LOGOUT);
                }
                success = (this._handle[srs.adapter.methods.TERMINATE]('') === 'true');
            }
            return success;
        },
        exit: function () {
            var success = this.terminate();
            return success;
        }
        
    };

};

srs.adapter.eventHandler = {
    bind: function (el, ev, fn) {
        if (window.addEventListener) {
            el.addEventListener(ev, fn, false);
        } else if (window.attachEvent) {
            el.attachEvent('on' + ev, fn);
        } else {
            el['on' + ev] = fn;
        }
    },
    unbind: function (el, ev, fn) {
        if (window.removeEventListener) {
            el.removeEventListener(ev, fn, false);
        } else if (window.detachEvent) {
            el.detachEvent('on' + ev, fn);
        } else {
            elem['on' + ev] = null; 
        }
    },
    stop: function (ev) {
        var e = ev || window.event;
        e.cancelBubble = true;
        if (e.stopPropagation) {
            e.stopPropagation();
        }
    }
};
