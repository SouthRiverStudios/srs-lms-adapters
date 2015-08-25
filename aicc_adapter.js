
// The MIT License (MIT)
// 
// AICC Data Adapter used to transfer data from application to AICC-based system
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

srs.adapter.type = 'AICC';
srs.adapter.version = '4.0';

srs.adapter.properties = {
    STUDENT_NAME : 'student_name',
    STUDENT_ID : 'student_id',
    LOCATION : 'lesson_location',
    STATUS : 'lesson_status',
    SUCCESS : null,
    SUSPEND_DATA : 'suspend_data',
    SCORE_RAW : 'score',
    SCORE_MIN : null,
    SCORE_MAX : null,
    SCORE_SCALED : null,
    CREDIT : 'credit',
    TOTAL_TIME : 'time',
    EXIT : null
};

srs.adapter.strings = {
    COMPLETED : 'complete',
    INCOMPLETE : 'incomplete',
    PASSED : null,
    NOT_ATTEMPTED : null,
    UNKNOWN : null,
    EXIT_SUSPEND : null,
    EXIT_LOGOUT : null
};

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
        
        _aicc_url : null,
        _aicc_sid : null,
        initialize : function (callback) {
        
            if (location.href.indexOf('?') !== -1) {
                
                var index = location.href.indexOf('?')+1,
                    query_str = location.href.substring(index),
                    query_array = (query_str.length===0 || query_str.indexOf('&') === -1) ? [] : query_str.split('&');

                for (var i in query_array) {
                    if ((typeof query_array[i] === 'string') && query_array[i].substring(0,4).toLowerCase() === 'aicc') {
                        var _q = (query_array[i].length<1 || query_array[i].indexOf('=') === -1) ? [] : query_array[i].split('=');
                        if (_q[0].toLowerCase()==='aicc_sid') {
                           this._aicc_sid = _q[1];
                        }
                        if (_q[0].toLowerCase()==='aicc_url') {
                            var url;
                            if (_q.length > 2) {
                                url = _q[1]+'='+_q[2];
                            } else {
                                url = _q[1];
                            }
                            this._aicc_url = decodeURIComponent(url.replace(/\+/g, ' '));
                        }
                    }
                }

                var self = this;
                if (window.addEventListener) {
                    window.addEventListener('unload', function (event) {
                        window.removeEventListener('unload', arguments.callee);
                        self.exit();
                    });
                } else {
                    window.attachEvent('onunload', function (event) {
                        window.detachEvent('onunload', arguments.callee);
                        self.exit();
                    });
                }
                this.getAICC(callback);
                
            } else {
                callback(new srs.adapter.user());
            }
            
        },
        read : function (data, callback) {
            
            this.log(data);
            
            var obj = this.aiccToObject(data),
                user_status = new srs.adapter.user();
                
            user_status.student_name = obj[srs.adapter.properties.STUDENT_NAME];
            user_status.student_id = obj[srs.adapter.properties.STUDENT_ID];
            user_status.location = obj[srs.adapter.properties.LOCATION];
            user_status.suspend_data = obj[srs.adapter.properties.SUSPEND_DATA];
            user_status.score_raw = obj[srs.adapter.properties.SCORE_RAW];
            user_status.credit = obj[srs.adapter.properties.CREDIT];
            user_status.total_time = obj[srs.adapter.properties.TOTAL_TIME];

            if (srs.adapter.properties.STATUS === srs.adapter.strings.COMPLETED || srs.adapter.properties.STATUS === 'c') {
                user_status.status = srs.adapter.strings.COMPLETED;
            } else {
                user_status.status = srs.adapter.strings.INCOMPLETE;
            }
            
            callback(user_status);
            
        },
        write : function (user) {

            if (this._aicc_url && user) {
            
                var passing_score = user.passing_score,
                    score = user.score_raw || '',
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
                
                var self = this,
                    delimiter = '\r\n',
                    string = delimiter+'[core]' + delimiter +
                                 srs.adapter.properties.LOCATION + '=' + location + delimiter +
                                 srs.adapter.properties.SCORE_RAW + '=' + score + delimiter +
                                 srs.adapter.properties.STATUS + '=' + status + delimiter +
                                 '[core_lesson]' + delimiter +
                                 srs.adapter.properties.SUSPEND_DATA + '=' + suspend_data.toString(),
                    encoded_str = encodeURIComponent(string);

                if (window.XMLHttpRequest) {
                    var request = new XMLHttpRequest();
                    request.open('POST', this._aicc_url, true);
                    request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
                    request.onreadystatechange = function (event) {
                            if (request.readyState === 4 && request.status === 200) {
                                self.log('PutParam Success');
                            }
                        }
                    request.onerror = function (event) {
                            self.log(request.responseText);
                        }
                    request.send("command=PutParam&version="+srs.adapter.version+"&session_id="+this._aicc_sid+"&AICC_Data="+encoded_str);
                } else {
                    this.log('XMLHttpRequest not supported.');
                }
            }
                
        },
        getAICC : function (callback) {
            var self = this;
            if (window.XMLHttpRequest) {
                var request = new XMLHttpRequest();
                request.open('POST', this._aicc_url, true);
                request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
                request.onreadystatechange = function (event) {
                        if (request.readyState === 4 && request.status === 200) {
                            self.read(request.responseText, callback);
                        }
                    }
                request.onerror = function (event) {
                        self.log(request.responseText);
                    }
                request.send("command=GetParam&version="+srs.adapter.version+"&session_id="+this._aicc_sid);
            } else {
                this.log('XMLHttpRequest not supported.');
            }
        },
        aiccToObject : function (str) {
            var obj = {},
                core_array = str.split('[core_lesson]'),
                objs = core_array[0].replace(/(\r\n|\n|\r)/gm,';').split(';'),
                core_lesson_str = core_array[1];
                
            if (core_lesson_str && core_lesson_str.length) {
            
                var core_lesson_array = core_lesson_str.split('[core_vendor]'),
                    suspend_str = core_lesson_array[0].replace(/(\r\n|\n|\r)/gm,''),
                    suspend_array = suspend_str.split('=');
           
                if (suspend_array[1] && suspend_array[1].length) {     
                    obj[srs.adapter.properties.SUSPEND_DATA] = suspend_array[1].split(',');
                }
            
            }
            
            for (var i=0; i < objs.length; i++) {
                objs[i] = objs[i].split('=');
                if (objs[i].length < 2) {
                    objs.splice(i, 1);
                } else {
                    obj[objs[i][0]] = objs[i][1];
                }
            }
            return obj;
        },
        log : function() {
			if (window.console) {
				console.log(Array.prototype.slice.call(arguments));
			}
		},
        terminate : function () {
            var self = this;
            if (window.XMLHttpRequest) {
                var request = new XMLHttpRequest();
                request.open('POST', this._aicc_url, true);
                request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
                request.onreadystatechange = function (event) {
                        if (request.readyState === 4 && request.status === 200) {
                            return true;
                        }
                    }
                request.onerror = function (event) {
                        self.log(request.responseText);
                    }
                request.send("command=ExitAU&version="+srs.adapter.version+"&session_id="+this._aicc_sid);
            } else {
                this.log('XMLHttpRequest not supported.');
            }
        },
        exit : function () {
            var success = this.terminate();
            return success;
        }
      
    };

};