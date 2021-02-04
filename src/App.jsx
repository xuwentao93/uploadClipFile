import React, { useState, useRef } from 'react';
import './App.css';

const SIZE = 200 * 1024; // 文件切片后, 每个切片最大的大小, 这里是 200KB.
function App() {
  const [file, setFile] = useState();

  const fileDOM = useRef();

  const methods = {
    request(url, method = 'post', data = {}, headers = {}, requestList) { // 自定义 ajax 请求.
      return new Promise(resolve => {
        const xhr = new XMLHttpRequest();
        xhr.open(method, url);
        Object.keys(headers).forEach(key =>
          xhr.setRequestHeader(key, headers[key])
        );
        xhr.send(data);
        xhr.onload = e => {
          resolve({
            data: e.target.response
          });
        };
      });
    },
    click() {
      fileDOM.current.click();
    },
    changeFile(e) {
      const [file] = e.target.files;
      console.log(file);
      setFile(file);
    },
    chunkFile() { // 对文件进行切片.
      if (!file) {
        alert('你还未选择任何文件!');
        return;
      }
      const chunkList = [];
      let cur = 0;
      while (cur < file.size) {
        chunkList.push(file.slice(cur, cur + SIZE));
        cur += SIZE;
      }
      let hash;
      for (let i = 0; i < 16; i++) {
        const random = parseInt(Math.random() * 16);
        switch (random) {
          case 10: hash += 'a'; break;
          case 11: hash += 'b'; break;
          case 12: hash += 'c'; break;
          case 13: hash += 'd'; break;
          case 14: hash += 'e'; break;
          case 15: hash += 'f'; break;
          default: hash += random;
        }
      }
      return chunkList.map((item, index) => ({
        chunk: item, // 切片后的文件.
        hash: hash + '-' + index // 切片后文件的下标.
      }));
    },
    async uploadChunkFile() {
      const fileChunkList = methods.chunkFile();
      console.log(fileChunkList);
      const requestList = fileChunkList.map(({ chunk, hash }) => {
        const data = new FormData();
        data.append('chunk', chunk);
        data.append('hash', hash);
        data.append('fileHash', 'unique');
        data.append('filename', file.name);
        return data;
      })
      .map((data) => methods.request('http://www.xuwentao.com:3456/file/upload', 'post', data));
      // const finishChunk = await Promise.all(requestList);
      // console.log(finishChunk);
      methods.request('http://www.xuwentao.com:3456/file/merge', 'post', JSON.stringify({
        fileHash: "unique",
        filename: file.name,
        size: file.size
      }),
      { 'content-type': 'application/json' });
    }
  };

  return (
    <div className="app">
      <input type="file" className="upload-file" ref={fileDOM} onChange={methods.changeFile} />
      <div className="button" onClick={methods.click}>选择文件</div>
      <div style={{ margin: '20px 0' }} />
      <div className="button" onClick={methods.chunkFile}>文件切片</div>
      <div style={{ margin: '20px 0' }} />
      <div className="button" onClick={methods.uploadChunkFile}>文件上传</div>
    </div>
  );
}

export default App;
