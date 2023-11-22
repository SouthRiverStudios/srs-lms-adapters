# SRS Data Adapters

SCORM and AICC data adapters for transferring data between an application and an LMS system.

## Instructions

```bash
npm i srs-data-adapters
```

### Usage

```bash

import AdapterSCORM from 'srs-data-adapters'

const version = AdapterSCORM.Versions.V1_2
const scorm = new AdapterSCORM(version)

// initialize object to start communication
scorm.initialize()
     .then(user => {
        console.info(user.student_name)
    })

score.read(user => {
    console.info(user.student_name)
}

scorm.write(lms_user)

```

### Legacy Version

See `legacy/README.md`