const conf = {
  backendURL:'http://local.cailab.org:8000',
  authServerURL: 'https://api.auth.cailab.org',
}

if (process.env.NODE_ENV === 'production') {
  conf.backendURL = 'http://local.cailab.org:8000'
}

export default conf;