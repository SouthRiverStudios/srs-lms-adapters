interface API_PROPERTIES {
  STUDENT_NAME:string
  STUDENT_ID:string
  LOCATION:string
  STATUS:string
  SUCCESS:string
  SUSPEND_DATA:string
  SCORE_RAW:string
  SCORE_MIN:string
  SCORE_MAX:string
  SCORE_SCALED:string
  CREDIT:string
  TOTAL_TIME:string
  EXIT:string
}

interface API_STRINGS {
  COMPLETED:string
  INCOMPLETE:string
  PASSED:string
  NOT_ATTEMPTED:string
  UNKNOWN:string
  EXIT_SUSPEND:string
  EXIT_LOGOUT:string
}

interface API_METHODS {
  INITIALIZE:string
  SET:string
  GET:string
  COMMIT:string
  TERMINATE:string
  GET_LAST_ERROR:string
}

export interface API_MAP {
  properties: API_PROPERTIES
  strings: API_STRINGS
  methods: API_METHODS
}

export interface LMSUser {
  student_name:string
  student_id:string|number
  location:string
  suspend_data:string[]
  score_raw:number
  credit:string|number
  total_time:string|number
  passing_score:number
  percent_complete:string|number
  status:string|number
}

export function createUser():LMSUser {
  return {
    student_name: '',
    student_id: '',
    location: '',
    suspend_data: [],
    score_raw: 0,
    credit: '',
    total_time: '',
    passing_score: 0,
    percent_complete: '',
    status:''
  }
}