import { Kyoku } from "@/components/kyoku"
import { convertAkochanToDisplay, soul2naga } from "@/hooks/converter"
import getDisplayLanguage from "@/hooks/getDisplayLanguage"
import { useEffect, useState } from "react"

import { sendToContentScript } from "@plasmohq/messaging"
import { Storage } from "@plasmohq/storage"

function NagaList() {
  const [isChecked, setIsChecked] = useState(false)
  const [bottun_message, setBottunMessage] = useState("0NP")
  const [Kyoku_info, setKyokuInfo] = useState([])
  const [nagaData, setNagaData] = useState<any>({})
  const [DisplayLang, setDisplayLang] = useState(0)
  useEffect(() => {
    const fetchData = async () => {
      //表示用言語の設定をlocal storageから呼び出す
      const DisplayLang = await getDisplayLanguage()
      console.log(DisplayLang)
      setDisplayLang(Number(DisplayLang))
      // activeなtabを取得しメッセージを送る
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, { message: 'tabNaga' }, (content) => {
          if (!content) {
            alert('Cannot Get! Try Reload First!');
            return;
          }
          console.log(content)
        });
      });
      // Akochan reviewerの形式になった牌譜から表示用のデータを取り出す。
      const DisplayData = convertAkochanToDisplay(MahjongSoulPaihuData)
      // DisplayDataの数だけ選択の状態を管理する
      setKyokuInfo(DisplayData)
      // 雀魂の牌譜jsonを天鳳形式に変換
      setNagaData(soul2naga(MahjongSoulPaihuData))
    }
    fetchData()
  }, [])


  const select = (index: number) => {
    const newKyokuInfo = Kyoku_info
    newKyokuInfo[index].isSelect = !newKyokuInfo[index].isSelect
    setKyokuInfo(newKyokuInfo)
  }

  const selectAll = () => {
    const newKyokuInfo = Kyoku_info
    let count = 0
    for (let j = 0; j < newKyokuInfo.length; j++) {
      if (newKyokuInfo[j].isSelect == true) {
        count = count + 1
      }
    }
    if (count == newKyokuInfo.length) {
      for (let j = 0; j < newKyokuInfo.length; j++) {
        newKyokuInfo[j].isSelect = false
      }
    } else {
      newKyokuInfo.map((info) => (info.isSelect = true))
    }
    setKyokuInfo(newKyokuInfo)
  }

  useEffect(() => {
    let count = 0
    for (let j = 0; j < Kyoku_info.length; j++) {
      if (Kyoku_info[j].isSelect == true) {
        count = count + 1
      }
    }
    setBottunMessage(count*10 + "NP")
  }, [Kyoku_info])
  /**
   * submitボタンを押したら選択状態の局の番号をまとめて、その局のデータを
   */
  const submitNaga = async () => {
    const useKyokus = []
    for (let i = 0; i < Kyoku_info.length; i++) {
      if (Kyoku_info[i].isSelect == true) {
        useKyokus.push(Kyoku_info[i].id)
      }
    }
    let URLstring = ""
    for (const useKyoku of useKyokus) {
      URLstring = URLstring + nagaData[useKyoku] + "\n"
    }
    //匿名モード
    if (isChecked == true) {
      const regexp = /"name":\[.+\],"rule"/g
      URLstring = URLstring.replace(
        regexp,
        '"name":["Aさん","Bさん","Cさん","Dさん"],"rule"'
      )
    }

    const storage = new Storage()
    await storage.set("toNagaData", URLstring)
    chrome.tabs.create({
      url: "https://naga.dmv.nico/naga_report/order_form/"
    })
  }

  return (
    <div className="template-box">
      <div>
        <div className="template-title">NAGA</div>
        <div className="w-full px-2 grid grid-cols-6 gap-4">
          <div className="text-base font-semibold text-mjsoul-text-lightblue py-2 col-start-1 col-span-3">
            Select hand
          </div>
          <div className="text-base font-semibold text-mjsoul-text-lightblue py-2 text-right col-start-4 col-span-2">
            {bottun_message}
          </div>
          <button
            type="button"
            className="my-button col-start-6 col-span-2"
            onClick={selectAll}>
            Select All
          </button>
        </div>
        {Kyoku_info.map((info_obj, index) => (
          <Kyoku
            key={info_obj.id}
            props={{
              language: DisplayLang,
              ba: info_obj.ba,
              kyoku_num: info_obj.kyoku_num,
              honba: info_obj.honba,
              result: info_obj.result,
              isSelect: info_obj.isSelect,
              onClick: () => select(index),
            }}
          />
        ))}
        <div className="w-full my-2 px-2 grid grid-cols-6 gap-4">
          <div className="col-start-2 col-span-2 py-3">
            <input
              type="checkbox"
              className="form-checkbox py-3"
              id="checkbox"
              checked={isChecked}
              onChange={() => setIsChecked(!isChecked)}
            />
            <label
              className="text-base text-mjsoul-text-lightblue ml-1 py-2"
              htmlFor="checkbox">
              匿名
            </label>
          </div>
          <p className="text-lg font-semibold text-mjsoul-text-lightblue py-2 text-right col-start-4 col-span-2">
            {bottun_message}
          </p>
          <button
            type="button"
            className="my-button col-start-6 col-span-1"
            onClick={submitNaga}>
            Go
          </button>
        </div>
      </div>
    </div>
  )
}

export default NagaList
