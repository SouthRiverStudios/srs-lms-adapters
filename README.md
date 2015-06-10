# SRS Data Adapters

SCORM and AICC data adapters for transferring data between an application and an LMS system.

## Instructions

Include either the scorm\_adapter.js or aicc\_adapter.js script in the root of your application. 

Manifest, metadata, descriptor files, etc. specific to each protocol should be included in the root of each application.

#### srs.adapter.type _(String)_
LMS protocol type, 'SCORM' or 'AICC'. 

#### srs.adapter.version _(String)_
LMS protocol version.

##### AICC: 
Specify AICC version.

##### SCORM: 

Specify support for SCORM 1.2 or SCORM 2004.

SCORM 1.2:

    srs.adapter.version = '1.2';
    
SCORM 2004:

    srs.adapter.version = '2004';

#### srs.adapter.properties _(Object)_
LMS property names specific to protocol type and version.

#### srs.adapter.strings _(Object)_
LMS string names specific to protocol type and version.

#### srs.adapter.methods _(Object)_
LMS method names specific to protocol type and version.

#### srs.adapter.user _(Object)_
User object to store and pass data between application and system.

#### srs.adapter.connection.initialize
Initializes the connection with the system.

    srs.adapter.connection.initialize(callback);
    
 - __callback__ : Callback function within the application to consume captured user data from system.

#### srs.adapter.connection.write
Write data to the system.

    srs.adapter.connection.write(user);
    
- __user__ : Object of user properties to write to the system in form of srs.adapter.user object.

#### srs.adapter.connection.exit
Exit the connection, and terminate the session with the system.

    srs.adapter.connection.exit();

