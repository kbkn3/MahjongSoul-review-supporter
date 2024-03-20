import React, { useState, useEffect } from 'react';

const MjaiList = () => {
  const [seki, setSeki] = useState([""]);
  const [MjaiURLstring, setMjaiURLstring] = useState("");

  const MSLang = useState(0);
  useEffect(() => {
    chrome.storage.local.get("MSLang", (result) => {
      if (typeof result.MSLang !== "undefined") {
        MSLang[1](result.MSLang);
      }
    });
  }, []);

  const url_head = [
    'https://game.mahjongsoul.com/?paipu=',
    'https://mahjongsoul.game.yo-star.com/?paipu=',
    'https://game.maj-soul.net/1/?paipu='
  ];
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    setMjaiURLstring(url_head[MSLang[0]] + request.message.ref);
    console.log(seki);
    setSeki([...seki, ...request.message.name]);
  });

  const submitMjai = (no) => {
    chrome.storage.local.set({ "toMjaiData": MjaiURLstring });
    chrome.storage.local.set({ "toMjaiData_no": no });
  }

  return (
    <div className="template-box">
      <div className="template-title">Motal/Acochan</div>
      {seki.length > 3 && (
        <>
          <div className="text-base font-semibold text-mjsoul-text-lightblue py-2">
            Which is your name?
          </div>
          {seki.slice(1, 5).map((name, index) => (
            <button key={index} type="button" className="my-button my-1" onClick={() => submitMjai(index + 1)}>
              {name}
            </button>
          ))}
        </>
      )}
    </div>
  );
}

export default MjaiList;

