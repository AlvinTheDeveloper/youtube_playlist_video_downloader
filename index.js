const fs = require('fs')
const parse = require('csv-parse');
const youtubedl = require('youtube-dl')
const axios = require('axios')
const config = require('./config/config.json')




function youtubeDataApi(playlistId,pageToken){
    let youtubeDataApiUrl=`https://www.googleapis.com/youtube/v3/playlistItems?part=id&part=contentDetails,snippet&playlistId=${playlistId}&key=${config.googleApiKey}`
    if(pageToken){
        youtubeDataApiUrl+=`&pageToken=${pageToken}`
    }
    return axios.get(youtubeDataApiUrl)
}


var playlistData=[];


fs.createReadStream("playlistId.csv")
    .pipe(parse({delimiter: ':'}))
    .on('data', function(csvrow) {
        playlistData.push(csvrow[0]);
    })
    .on('end',async function() {
        console.log(playlistData);
        for(let pd of playlistData){
            let nextPageToken=null
            do{

                let res=await youtubeDataApi(pd,nextPageToken)
                nextPageToken=res.data.nextPageToken

                for(let item of res.data.items){
                    setTimeout(()=>{
                        const video = youtubedl(`http://www.youtube.com/watch?v=${item.contentDetails.videoId}`,
                            // Optional arguments passed to youtube-dl.
                            ['--format=18'],
                            // Additional options can be given for calling `child_process.execFile()`.
                            { cwd: __dirname })

                        // Will be called when the download starts.
                        video.on('info', function(info) {
                            console.log('Download started')
                            console.log('filename: ' + info._filename)
                            console.log('size: ' + info.size)
                        })

                        video.pipe(fs.createWriteStream(item.snippet.title+'.mp4'))
                    },1000)
                }
            }while(nextPageToken)
        }
    });


