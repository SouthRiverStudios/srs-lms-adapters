# SRS LMS Adapters

## About

SCORM and AICC compliant communication objects for transferring data between an application and an LMS system.

## Getting Started

### Installation

```sh
npm i srs-lms-adapters
```

## Usage

```javascript

// import either adapter
import AdapterSCORM from 'srs-lms-adapters'
import AdapterAICC from 'srs-lms-adapters'

// create a new adapter
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

// update and write user
lms_user.percent_complete = 1
scorm.write(lms_user)

// end session
if (scorm.terminate()) {
    lms_user = null
}

```

## Roadmap

- [ ] Improved documentation
- [ ] Add Changelog
- [ ] xAPI support

## Contributing

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

Distributed under the MIT License. See `LICENSE` for more information.

## Contact

South River Studios, LLC - [@\_southriver\_](https://twitter.com/_southriver_) - dev@southriverstudios.com

Project Link: [https://github.com/SouthRiverStudios/srs-lms-adapters](https://github.com/SouthRiverStudios/srs-lms-adapters)


## Legacy Version

See `legacy/README.md`