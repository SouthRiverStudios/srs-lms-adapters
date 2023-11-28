# SRS LMS Adapters

SCORM and AICC compliant communication objects for transferring data between an application and an LMS system.

## Instructions

```bash
npm i srs-lms-adapters
```

### Usage SCORM

```bash

import AdapterSCORM from 'srs-lms-adapters'

const version = AdapterSCORM.Versions.V1_2
const scorm = new AdapterSCORM(version)
let lms_user

// initialize object to start communication
scorm.initialize()
     .then(user => {
        lms_user = user
    })

// read user
score.read(user => {
    lms_user = user
}

// write user
lms_user.percent_complete = 1
scorm.write(lms_user)

// end session
if (scorm.terminate()) {
    lms_user = null
}

```

### Usage AICC

```bash

import AdapterAICC from 'srs-lms-adapters'

const version = AdapterAICC.Versions.V4
const aicc = new AdapterAICC(version)
let lms_user

// initialize object to start communication
aicc.initialize()
     .then(user => {
        lms_user = user
    })

// read user
aicc.read(user => {
    lms_user = user
}

// write user
lms_user.percent_complete = 1
aicc.write(lms_user)

// end session
if (aicc.terminate()) {
    lms_user = null
}

```

### Legacy Version

See `legacy/README.md`