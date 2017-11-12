const Swagger = require('swagger-client')

const compile = new Swagger('https://compile.xod.show/swagger')
const pm = new Swagger('https://pm.xod.show/swagger')
const releases = new Swagger('https://releases.xod.show/swagger')

void async function main () {
  {
    const res = await (await compile).apis.Upload.getUpload({board_id: 'uno'})
    if (res.status === 200)
      console.log(res.body)
    else
      console.error(res)
  }
  {
    const res = await (await releases).apis.default.getReleases({})
    if (res.status === 200)
      for (const release of res.body.records)
        for (const file of release.files)
          console.log(`[${file.name}](${file.href})`)
    else
      console.error(res)
  }
  {
    const res = await (await pm).apis.User.getUsers({})
    if (res.status === 200)
      for (const user of res.body.records)
        console.log(user.username)
    else
      console.error(res)
  }
}()
