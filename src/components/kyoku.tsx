type Props = {
  props: {
    language: number,
    ba: number,//場風
    kyoku_num: number,//局数
    honba: number,//本場
    result: any[][],
    isSelect: boolean
    onClick: () => void
  }
}
const ba_str = [
  ["東", "南", "西", "北"],
  ["East", "South", "West", "North"],
  ["東", "南", "西", "北"],
];
const honba_str = ["本場", "Repeat Counter", "本場"];
const Win_str = [
  ["ロン和", "ツモ和"],
  ["Ron", "Tsumo"],
  ["榮和", "自摸"],
];
const Deal_str = ["放銃", "Deal-in", "放銃"];

export const Kyoku = ({props}: Props) => {
  const { language, ba, kyoku_num, honba, result, isSelect } = props

  return (
    <div className={`mx-1 my-2 block max-w-sm rounded-lg border-2  bg-mjsoul-grad-dark-blue p-2 shadow-md hover:bg-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 ${isSelect ? 'border-red-600' : 'border-gray-200'}`}>
      <div className={`text-lg  text-mjsoul-text-lightblue hudetext`}>
        {ba_str[language][ba]}
        {kyoku_num} {language === 1 ? '&emsp;' : '局'} {honba} {language === 1 ? 'Counter Repeat' : '本場'}
      </div>

      {/* Ron pattern */}
      <div style={{display: result[0][0] === 'ロン和' ? 'block' : 'none'}}>
        {result.map((item, index) => (
          <div key={index} style={{display: index < 3 ? 'block' : 'none'}} className="flex flex-row items-end">
            <div className="text-left text-base w-1/4 hudetext text-pink-500">{Win_str[language][0]}</div>
            <div className="text-center text-base text-gray-300 w-1/2 ">{item[1]}</div>
            <div className="text-right text-base text-gray-300 w-1/4">+{item[3]}</div>
          </div>
        ))}
        <hr />
        <div className="flex flex-row items-end">
          <div className="text-left text-base w-1/4 hudetext text-purple-500">{Deal_str[language]}</div>
          <div className="text-center text-base text-gray-300 w-1/2">{result[0][2]}</div>
          <div className="text-right text-base text-gray-300 w-1/4">{result[0][4] + (result[1] ? result[1][4] : null) + (result[2] ? result[2][4] : null)}</div>
        </div>
      </div>

      {/* Tsumo pattern */}
      <div style={{display: result[0][0] === 'ツモ和' ? 'block' : 'none'}}>
        <div className="flex flex-row items-end">
          <div className="text-left text-base w-1/4 hudetext text-pink-500"> {Win_str[language][1]}</div>
          <div className="text-center text-base text-gray-300 w-1/2">{result[0][1]}</div>
          <div className="text-right text-base text-gray-300 w-1/4">+{result[0][3]}</div>
        </div>
      </div>

      {/* Ryukyoku pattern */}
      <div style={{display: result[0][0] === '流局' ? 'block' : 'none'}}>
        {result[0].slice(1).map((item, n) => (
          <div key={n} className="flex flex-row items-end">
            <div className="text-left text-base w-1/4 hudetext text-gray-300"> {result[0][0]}</div>
            <div className="text-center text-base text-gray-300 w-1/2">{item}</div>
            <div className="text-right text-base text-gray-300 w-1/4">+{3000 / (result[0].length - 1)}</div>
          </div>
        ))}
      </div>

      {/* Others pattern */}
      <div style={{display: result[0][0] !== 'ツモ和' && result[0][0] !== 'ロン和' && result[0][0] !== '流局' ? 'block' : 'none'}}>
        <div className="text-left text-base w-1/4 hudetext text-gray-300"> {result[0][0]}</div>
      </div>
    </div>
  )
}
