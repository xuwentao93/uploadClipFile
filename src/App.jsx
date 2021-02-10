/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useRef } from 'react';
import './app.css';
import { useEffect } from 'react';

const SIZE = 200 * 1024; // 文件切片后, 每个切片最大的大小, 这里是 200KB.
function App() {
  const [file, setFile] = useState({}); // 要切块的文件.
  const [fileList, setFileList] = useState([]); // 切块后的文件数组.
  const [progress, setProgress] = useState(0);

  const fileDOM = useRef();

  const methods = {
    request(url, method = 'post', data = {}, headers = {}, requestList, onProgress) { // 自定义 ajax 请求.
      return new Promise(resolve => {
        const xhr = new XMLHttpRequest();
        xhr.upload.onprogress = onProgress; // upload.onprogress 在文件上传完一个才会调用.
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
      let hash = '';
      for (let i = 0; i < 16; i++) {
        const random = parseInt(Math.random() * 16);
        switch (random) {
          case 10: hash += 'a'; break;
          case 11: hash += 'b'; break;
          case 12: hash += 'c'; break;
          case 13: hash += 'd'; break;
          case 14: hash += 'e'; break;
          case 15: hash += 'f'; break;
          default: hash += random + '';
        }
      }
      const chunkFileList = chunkList.map((item, index) => ({
        chunk: item, // 切片后的文件.
        hash: hash + '-' + index // 切片后文件的下标.
      }));
      setFileList(chunkFileList);
      return chunkFileList;
    },
    async uploadChunkFile() {
      // methods.chunkFile();
      const requestList = fileList.map(({ chunk, hash }) => {
        const data = new FormData();
        data.append('chunk', chunk);
        data.append('hash', hash);
        data.append('fileHash', 'unique');
        data.append('filename', file.name);
        return data;
      })
      .map((data, index) => methods.request('http://www.xuwentao.com:3456/file/upload', 'post', data, {}, null, methods.getFileUploadProgress(index)));
      await Promise.all(requestList); // 等所有文件切块都上传了, 在调用合并接口.
      // console.log(finishChunk);
      methods.request('http://www.xuwentao.com:3456/file/merge', 'post', JSON.stringify({
        fileHash: "unique",
        filename: file.name,
        size: file.size
      }),
      { 'content-type': 'application/json' });
    },
    getFileUploadProgress(i) { // 获取文件上传进度.
      return function(e) {
        // console.log(e);
        console.log(e.loaded);
        // // 没有使用 setFileList 去更新, 不会触发 useEffect.
        fileList[i].percent = e.total;
        let curProgress = 0;
        for (let i = 0; i < fileList.length; i++) {
          // 0 或者 undefined 都不计算.
          if (fileList[i].percent) curProgress += fileList[i].percent;
        }
        setProgress(parseInt(curProgress * 100 / file.size));
      };
    }
  };

  useEffect(() => {
    if (fileList.length === 0) return;
    methods.uploadChunkFile();
  }, [fileList]);

  return (
    <div className="app">
      <input type="file" className="upload-file" ref={fileDOM} onChange={methods.changeFile} />
      <div className="button" onClick={methods.click}>选择文件</div>
      <div style={{ margin: '20px 0' }} />
      <div className="button" onClick={methods.chunkFile}>文件切片</div>
      <div style={{ margin: '20px 0' }} />
      <div className="button" onClick={methods.chunkFile}>文件上传</div>
      <div className="out-progress">
        <div className="in-progress" style={{ width: `${progress}%` }} />
      </div>
      <div className="progress-brief">{progress}%</div>
    </div>
  );
}

export default App;
