const conf = {
  backendURL:'http://localhost:8000'
}

if (process.env.NODE_ENV === 'production') {
  conf.backendURL = 'http://local.cailab.org:8000'
}

export default conf;