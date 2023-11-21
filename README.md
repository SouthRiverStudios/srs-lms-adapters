# SRS Data Adapters

SCORM and AICC data adapters for transferring data between an application and an LMS system.

## Instructions

```bash
npm i https://github.com/SouthRiverStudios/srs-data-adapters.git
```

### Usage

```bash

import ScormAdapter from 'srs-data-adapters'

let scorm = new ScormAdapter('2004')

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