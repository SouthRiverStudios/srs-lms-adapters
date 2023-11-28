import { log } from "./utils/logger"

import { 
  API_MAP,
  LMSUser, 
  createUser 
} from "./shared"

export const VERSIONS = {
  V4: '4.0',
} as const

type VersionAICC = typeof VERSIONS[keyof typeof VERSIONS]

const ADAPTER_API_MAP:{[key:string]: API_MAP} = {
  [VERSIONS.V4]: {
    properties: {
      STUDENT_NAME : 'student_name',
      STUDENT_ID : 'student_id',
      LOCATION : 'lesson_location',
      STATUS : 'lesson_status',
      SUCCESS : '',
      SUSPEND_DATA : 'suspend_data',
      SCORE_RAW : 'score',
      SCORE_MIN : '',
      SCORE_MAX : '',
      SCORE_SCALED : '',
      CREDIT : 'credit',
      TOTAL_TIME : 'time',
      EXIT : ''
    },
    strings: {
      COMPLETED: 'complete',
      INCOMPLETE: 'incomplete',
      PASSED: '',
      NOT_ATTEMPTED: '',
      UNKNOWN: '',
      EXIT_SUSPEND: '',
      EXIT_LOGOUT: ''
    },
    methods: {
      INITIALIZE: '',
      SET: '',
      GET: '',
      COMMIT: '',
      TERMINATE: '',
      GET_LAST_ERROR: ''
    }
  }
}

function parseAICC(data:string, version:VersionAICC):LMSUser {

  let properties = ADAPTER_API_MAP[version].properties
  let strings = ADAPTER_API_MAP[version].strings

  let obj = {} as {[key:string]: any}
  let core_array = data.split('[core_lesson]')
  let objs = core_array[0].replace(/(\r\n|\n|\r)/gm,';').split(';')
  let core_lesson_str = core_array[1]

  if (core_lesson_str && core_lesson_str.length) {
    let core_lesson_array = core_lesson_str.split('[core_vendor]')
    let suspend_str = core_lesson_array[0].replace(/(\r\n|\n|\r)/gm,'')
    let suspend_array = suspend_str.split('=')
 
    if (suspend_array[1] && suspend_array[1].length) {
      let key = properties.SUSPEND_DATA
      obj[key] = suspend_array[1].split(',')
    }
  }
  
  for (let i=0; i < objs.length; i++) {
    // @ts-ignore
    objs[i] = objs[i].split('=')
    if (objs[i].length < 2) {
      objs.splice(i, 1)
    } else {
      obj[objs[i][0]] = objs[i][1]
    }
  }

  const user = createUser()

  user.student_name = obj[properties.STUDENT_NAME];
  user.student_id = obj[properties.STUDENT_ID];
  user.location = obj[properties.LOCATION];
  user.suspend_data = obj[properties.SUSPEND_DATA];
  user.score_raw = obj[properties.SCORE_RAW];
  user.credit = obj[properties.CREDIT];
  user.total_time = obj[properties.TOTAL_TIME];

  if (properties.STATUS === strings.COMPLETED || properties.STATUS === 'c') {
    user.status = strings.COMPLETED;
  } else {
    user.status = strings.INCOMPLETE;
  }

  return user
}

function getAICC(url:string, sid:string, version:VersionAICC):Promise<LMSUser> {
  return new Promise((resolve, reject) => {
    if (window.XMLHttpRequest) {
      var request = new XMLHttpRequest()
      request.open('POST', url, true)
      request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8')
      request.onreadystatechange = (event) => {
        if (request.readyState === 4 && request.status === 200) {
          resolve(parseAICC(request.responseText, version))
        }
      }
      request.onerror = (event) => {
        log(request.responseText)
        reject()
      }
      request.send(`command=GetParam&version=${version}&session_id=${sid}`);
    }
    else {
      throw new Error('#getAICC > XMLHttpRequest not supported.')
    }
  })
}

export default class AdapterAICC {

  static Versions = VERSIONS
  #version
  #api_map:API_MAP
  #aicc_url = ''
  #aicc_sid = ''

  constructor(version:VersionAICC=VERSIONS.V4) {
    this.#version = version
    this.#api_map = ADAPTER_API_MAP[version]
  }

  get version():VersionAICC {
    return this.#version
  }

  initialize():Promise<LMSUser> {

    if (window && window.location) {
      if (location.href.indexOf('?') !== -1) {
        let index = location.href.indexOf('?')+1
        let query_str = location.href.substring(index)
        let query_array = (query_str.length===0 || query_str.indexOf('&') === -1) ? [] : query_str.split('&');

        for (var i in query_array) {
          if ((typeof query_array[i] === 'string') && query_array[i].substring(0,4).toLowerCase() === 'aicc') {
            let _q = (query_array[i].length<1 || query_array[i].indexOf('=') === -1) ? [] : query_array[i].split('=')
            if (_q[0].toLowerCase()==='aicc_sid') {
              this.#aicc_sid = _q[1]
            }
            if (_q[0].toLowerCase()==='aicc_url') {
              let url = _q[1]
              if (_q.length > 2) {
                url = _q[1]+'='+_q[2]
              }
              this.#aicc_url = decodeURIComponent(url.replace(/\+/g, ' '))
            }
          }
        }
        if (this.#aicc_url && this.#aicc_sid && this.#version) {
          window.addEventListener('unload', this.terminate)
          return getAICC(this.#aicc_url, this.#aicc_sid, this.#version)
        }
        else {
          throw new Error('#initialize > aicc_url, aicc_sid, and/or version is undefined.')
        }
      }
      else {
        return Promise.reject()
      }
    } 
    else {
      return Promise.reject(new Error('#initialize > Adapter could not be initialized'))
    }
  }

  read():Promise<LMSUser> {
    return Promise.reject('noop')
  }

  write(user:LMSUser):Promise<boolean> {

    if (user && this.#aicc_url && this.#aicc_sid && this.#version) {

      if (window.XMLHttpRequest) {

        return new Promise((resolve) => {

          let passing_score = user.passing_score
          let score = user.score_raw || 0
          let percent_complete = user.percent_complete
          let suspend_data = user.suspend_data
          let location = user.location
          let status = null

          const properties = this.#api_map.properties
          const strings = this.#api_map.strings
              
          if(passing_score && score && score >= passing_score && percent_complete === 1) {
            status = strings.COMPLETED;
          }
          else if (!passing_score && percent_complete === 1) {
            status = strings.COMPLETED;
          }
          else {
            status = strings.INCOMPLETE;
          }
          
          let delimiter = '\r\n'
          let uri = delimiter+'[core]' + delimiter +
                    properties.LOCATION + '=' + location + delimiter +
                    properties.SCORE_RAW + '=' + score + delimiter +
                    properties.STATUS + '=' + status + delimiter +
                    '[core_lesson]' + delimiter +
                    properties.SUSPEND_DATA + '=' + suspend_data.toString()
          let encoded_str = encodeURIComponent(uri)
          
          let request = new XMLHttpRequest()
          request.open('POST', this.#aicc_url, true)
          request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8')
          request.onreadystatechange = function (event) {
            if (request.readyState === 4 && request.status === 200) {
              log('#write > PutParam Success')
              resolve(true)
            }
          }
          request.onerror = function (event) {
            log(request.responseText)
          }
          request.send(`command=PutParam&version=${this.#version}&session_id=${this.#aicc_sid}&AICC_Data=${encoded_str}`)
        })
      }
      else {
        throw new Error('#write > XMLHttpRequest not supported.')
      }
    }
    else {
      throw new Error('#write > user, aicc_url, aicc_sid, and/or version is undefined. Did you call #initilize?')
    }
  }

  terminate() {
    if (this.#aicc_url && this.#aicc_sid && this.#version) {
      if (window.XMLHttpRequest) {
        let request = new XMLHttpRequest()
        request.open('POST', this.#aicc_url, true)
        request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8')
        request.onreadystatechange = function (event) {
          if (request.readyState === 4 && request.status === 200) {
            return true
          }
        }
        request.onerror = function (event) {
          log(request.responseText)
        }
        request.send(`command=ExitAU&version=${this.#version}&session_id=${this.#aicc_sid}`)
      } 
      else {
        throw new Error('#terminate > XMLHttpRequest not supported.')
      }
    } 
    else {
      throw new Error('#terminate > aicc_url, aicc_sid, and/or version is undefined. Did you call #initilize?')
    }
  }

}