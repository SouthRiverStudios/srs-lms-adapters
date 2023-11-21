import { log } from './utils/logger'
import { 
  LMSUser,
  API_MAP,
  createUser
} from './shared'

type ScormVersion = '1.2' | '2004'

const ADAPTER_API_MAP:{[key:string]: API_MAP} = {
  '1.2': {
    properties: {
      STUDENT_NAME: 'cmi.core.student_name',
      STUDENT_ID: 'cmi.core.student_id',
      LOCATION: 'cmi.core.lesson_location',
      STATUS: 'cmi.core.lesson_status',
      SUCCESS: '',
      SUSPEND_DATA: 'cmi.suspend_data',
      SCORE_RAW: 'cmi.core.score.raw',
      SCORE_MIN: 'cmi.core.score.min',
      SCORE_MAX: 'cmi.core.score.max',
      SCORE_SCALED: '',
      CREDIT: 'cmi.core.credit',
      TOTAL_TIME: 'cmi.core.total_time',
      EXIT: 'cmi.core.exit'
    },
    strings: {
      COMPLETED: 'completed',
      INCOMPLETE: 'incomplete',
      PASSED: 'passed',
      NOT_ATTEMPTED: 'not attempted',
      UNKNOWN: 'unknown',
      EXIT_SUSPEND: 'suspend',
      EXIT_LOGOUT: 'logout'
    },
    methods: {
      INITIALIZE: 'LMSInitialize',
      SET: 'LMSSetValue',
      GET: 'LMSGetValue',
      COMMIT: 'LMSCommit',
      TERMINATE: 'LMSFinish',
      GET_LAST_ERROR: 'LMSGetLastError'
    }
  },
  '2004': {
    properties: {
      STUDENT_NAME: 'cmi.learner_name',
      STUDENT_ID: 'cmi.learner_id',
      LOCATION: 'cmi.location',
      STATUS: 'cmi.completion_status',
      SUCCESS: 'cmi.success_status',
      SUSPEND_DATA: 'cmi.suspend_data',
      SCORE_RAW: 'cmi.score.raw',
      SCORE_MIN: 'cmi.score.min',
      SCORE_MAX: 'cmi.score.max',
      SCORE_SCALED: 'cmi.score.scaled',
      CREDIT: 'cmi.credit',
      TOTAL_TIME: 'cmi.total_time',
      EXIT: 'cmi.exit'
    },
    strings: {
      COMPLETED: 'completed',
      INCOMPLETE: 'incomplete',
      PASSED: 'passed',
      NOT_ATTEMPTED: 'not attempted',
      UNKNOWN: 'unknown',
      EXIT_SUSPEND: 'suspend',
      EXIT_LOGOUT: 'normal'
    },
    methods:{
      INITIALIZE: 'Initialize',
      SET: 'SetValue',
      GET: 'GetValue',
      COMMIT: 'Commit',
      TERMINATE: 'Terminate',
      GET_LAST_ERROR: 'GetLastError'
    }
  }
}

function findAPI(version:ScormVersion, target:any):any {
    let api = null
    let findAttempts = 0
    let findAttemptLimit = 500

    while (
      (!target.API && !target.API_1484_11) &&
      target.parent &&
      target.parent !== target &&
      findAttempts <= findAttemptLimit) {
        findAttempts++
        target = target.parent
    }

    if (version === '2004') {
      if (target.API_1484_11) {
        api = target.API_1484_11
      } else {
        throw new Error('#findApi > SCORM version 2004 was specified by user, but API_1484_11 cannot be found.')
      }
    }
    else if (version === '1.2') {
      if (target.API) {
        api = target.API
      }
      else {
        throw new Error('#findAPI > SCORM version 1.2 was specified by user, but API cannot be found.')
      }
    }

    if (api) {
      log("API: " + api)
    } else {
      log(`Error finding API. Find attempts: ${findAttempts}. Find attempt limit: ${findAttemptLimit}`)
    }

    return api
}

function getAPI(version:ScormVersion):any {
  let api = null
  
  if (window.parent && window.parent !== window ) {
    api = findAPI(version, window.parent)
  }

  if (!api && window.top && window.top.opener) {
    api = findAPI(version, window.top.opener)
  }

  if (!api && window.opener) {
    api = findAPI(version, window.opener)
  }

  if (!api && window.opener && window.opener.opener) {
    api = findAPI(version, window.opener.opener)
  }

  if (!api && window.top && window.top.opener && window.top.opener.document) {
    api = findAPI(version, window.top.opener.document)
  }

  if (!api) {
    throw new Error("#getAPI > Failed: Can't find the API!")
  }

  return api
}

function throwNoApi(prefix:string) {
  throw new Error(`${prefix} > #api does not exist`)
}

export class Adapter {

  #version:ScormVersion
  #api_map:API_MAP
  #api = null

  constructor(version:ScormVersion) {
    this.#version = version
    this.#api_map = ADAPTER_API_MAP[version]
  }

  get version():ScormVersion {
    return this.#version
  }
  
  initialize():Promise<LMSUser> {
    this.#api = getAPI(this.#version)
    if (this.#api) {
      if (window && window.addEventListener) {
        window.addEventListener('unload', this.terminate)
      }
      return this.read()
    }
    else {
      return Promise.reject(new Error('#initialize > Adapter could not be initialized'))
    }
  }

  read():Promise<LMSUser> {

    return new Promise((resolve, reject) => {

      if (this.#api) {
        const init_method = this.getAPIMethod(this.#api_map.methods.INITIALIZE)
        let success = (typeof init_method === 'function' && init_method('') === 'true')
  
        if (success) {
          let user_status = createUser()
          const properties = this.#api_map.properties
          const strings = this.#api_map.strings
          user_status.student_name = this.getProperty(properties.STUDENT_NAME) as string
          user_status.student_id = this.getProperty(properties.STUDENT_ID)
          user_status.location = this.getProperty(properties.LOCATION) as string
          const suspend_data = this.getProperty(properties.SUSPEND_DATA) as string
          user_status.suspend_data = suspend_data.split(',')
          user_status.score_raw = this.getProperty(properties.SCORE_RAW) as number
          user_status.credit = this.getProperty(properties.CREDIT)
          user_status.total_time = this.getProperty(properties.TOTAL_TIME)

          if (
            this.getProperty(properties.STATUS) === strings.NOT_ATTEMPTED || 
            this.getProperty(properties.STATUS) === strings.UNKNOWN
          ) {
            user_status.status = strings.INCOMPLETE
          }
          resolve(user_status)
        }
        else {
          throwNoApi('#read')
        }
      }
      else {
        throwNoApi('#read')
      }
    })
  }

  write(user:LMSUser):Promise<LMSUser> {

    if (this.#api) {

      if (!user) {
        throw new Error('#write > method requires a ScormUser object ')
      }

      let passing_score = user.passing_score
      let score = 0
      let percent_complete = user.percent_complete
      let suspend_data = user.suspend_data
      let location = user.location
      let status = null

      const properties = this.#api_map.properties
      const strings = this.#api_map.strings

      if (user.score_raw || user.score_raw === 0) {
        score = user.score_raw
      }
      else {
        score = this.getProperty(properties.SCORE_RAW) as number
      }

      if (passing_score && score && score >= passing_score && percent_complete === 1) {
        status = strings.COMPLETED
      }
      else if (!passing_score && percent_complete === 1) {
        status = strings.COMPLETED
      }
      else {
        status = strings.INCOMPLETE
      }

      this.setProperty(properties.SCORE_RAW, score)
      this.setProperty(properties.STATUS, status)
      this.setProperty(properties.LOCATION, location)

      if (suspend_data && suspend_data.length) {
        this.setProperty(properties.SUSPEND_DATA, suspend_data.toString())
      }

      if (this.#version === '2004' && this.getProperty(properties.STATUS) === strings.COMPLETED) {
          this.setProperty(properties.SUCCESS, strings.PASSED);
      }
      if (this.#version === '2004' && this.getProperty(properties.SCORE_RAW)) {
          this.setProperty(properties.SCORE_SCALED, score/100);
      }

      return this.read()
    }
    else {
      return new Promise(()=> throwNoApi('#write'))
    }
  }

  getAPIMethod(name:string):Function|undefined {
    let result
    if(this.#api) {
      result = this.#api[name] as Function
    }
    else {
      throwNoApi('#getAPIMethod')
    }
    return result
  }

  getProperty(prop:string):string|number {
    let result
    if (this.#api) {
      const get_method = this.#api[this.#api_map.methods.GET] as Function
      result = typeof get_method === 'function' && get_method(prop)
    }
    else {
      throwNoApi('#getProperty')
    }
    return result
  }

  setProperty(prop:string, val:any) {
    if (this.#api) {
      const set_method = this.getAPIMethod(this.#api_map.methods.SET)
      if (set_method) {
        set_method(prop, val)
      }
    }
    else {
      throwNoApi('#setProperty')
    }
  }

  getLastError():string|number {
    let code = 0
    if (this.#api) {
      const error_method = this.getAPIMethod(this.#api_map.methods.GET_LAST_ERROR)
      if (error_method) {
        code = parseInt(error_method(), 10)
      }
    }
    else {
      throwNoApi('#getLastError')
    }
    return code
  }

  terminate():boolean {
    let result = false
    if (this.#api) {
      const properties = this.#api_map.properties
      const strings = this.#api_map.strings
      const completed = this.getProperty(properties.STATUS) === strings.COMPLETED
      const passed = this.getProperty(properties.STATUS) === strings.PASSED
      if(!completed && !passed) {
        this.setProperty(properties.EXIT, strings.EXIT_SUSPEND)
      } else {
        this.setProperty(properties.EXIT, strings.EXIT_LOGOUT)
      }
      const term_method = this.getAPIMethod(this.#api_map.methods.TERMINATE)
      result = !!term_method && term_method('') === 'true'
    }
    else {
      throwNoApi('#terminate')
    }
    return result
  }

}
