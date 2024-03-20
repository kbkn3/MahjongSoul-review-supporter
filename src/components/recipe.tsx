import getDisplayLanguage from "@/hooks/getDisplayLanguage";
import React, { useEffect, useState } from "react"

const description = [
  "Excelやスプレッドシートにコピペできる戦績です。",
  "The results can be copied and pasted into Excel or spreadsheets.",
  "结果可以被复制并粘贴到Excel或电子表格中。"
]
const descriptionColumn = [
  "ゲームID,名前,素点,順位,和了,放銃,立直,副露,ツモ,ロン,局数,流局数",
  "gameID,name,Table Points,rank,num of Win,num of Deal-in,num of riichi,num of meld,num of Tsumo,num of Ron,num of game,num of exhaustive",
  "gameID,帐户名,标准分之和,名次,和了数,放銃数,立直数,副露数,自摸数,榮和数,局数,荒牌数"
]

type TableRow = {
  gameID?: string;
  name?: string;
  tablePoints?: number;
  rank?: number;
  numWin?: number;
  numDealIn?: number;
  numRiichi?: number;
  numMeld?: number;
  numTsumo?: number;
  numRon?: number;
  numGame?: number;
  numExhaustive?: number;
}

const RecipeList = () => {
  const [TableText, setTableText] = useState("牌譜を読み込めていません")
  const language = getDisplayLanguage()
  useEffect(() => {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      for (let s = 0; s < request.message.name.length; s++) {
        request.message.name[s] = request.message.name[s].replace(
          /[#<>"%]/gi,
          ""
        )
      }
      processData(request.message, request.message.ref)
    })
  }, [])

  const processData = (message, ref_id) => {
    const tableData: TableRow[] = [
      {},
      {},
      {},
      {}
    ]

    //固定データの記入
    let score = []
    for (let j = 0; j < message.name.length; j++) {
      tableData[j].gameID = ref_id //ゲームID
      tableData[j].name = message.name[j] //名前
      tableData[j].tablePoints = message.sc[2 * j] //素点
      tableData[j].numGame = message.log.length //局数
      score.push(message.sc[2 * j + 1]) //順位点込みのポイント
    }
    //順位計算
    let sorted = score.slice().sort(function (a, b) {
      return b - a
    })
    let ranks = score.slice().map(function (x) {
      return sorted.indexOf(x) + 1
    })
    for (let k = 0; k < 4; k++) {
      tableData[k].rank = ranks[k]
    }

    //局ごとの値確認
    for (let i = 0; i < message.log.length; i++) {
      if (message.log[i][16][0] === "和了") {
        //和了がいる場合
        for (let t = 1; t < ~~(message.log[i][16].length / 2) + 1; t++) {
          //ダブロン・トリロンに対応
          if (message.log[i][16][2 * t][0] == message.log[i][16][2 * t][1]) {
            //ツモの場合
            tableData[message.log[i][16][2 * t][0]].numWin++ //和了回数
            tableData[message.log[i][16][2 * t][0]].numTsumo++ //ツモ回数
          } else {
            tableData[message.log[i][16][2 * t][0]].numRon++ //和了回数
            tableData[message.log[i][16][2 * t][1]].numDealIn++ //ロン回数
            tableData[message.log[i][16][2 * t][1]].numRiichi++ //放銃回数
          }
        }
      } else {
        for (let s = 0; s < 4; s++) {
          tableData[s].numExhaustive++ //流局回数
        }
      }
      for (let s = 0; s < 4; s++) {
        if (
          message.log[i][3 * s + 5].filter(RegExp.prototype.test, /[.*(c|p).*]/)
            .length
        ) {
          tableData[s].numMeld++ //副露回数
        }
        if (
          message.log[i][3 * s + 6].filter(RegExp.prototype.test, /[.*r.*]/)
            .length
        ) {
          tableData[s].numRiichi++ //立直回数
        }
      }
    }

    let text = ""
    for (let a = 1; a < tableData.length; a++) {
      text += Object.values(tableData[a]).join("\t") + "\n"
    }
    setTableText(text)  
  }

  return (
    <div className="template-box">
      <div className="template-title">Result Output</div>
      <div className="pt-2 text-xs">
        <p className="mb-2 text-mjsoul-text-lightblue">{ description[language]}</p>
        <p className="mb-2 text-mjsoul-text-lightblue">
          {descriptionColumn[language]}
        </p>
        <textarea name="" id="" value={TableText} readOnly></textarea>
      </div>
    </div>
  )
}

export default RecipeList
