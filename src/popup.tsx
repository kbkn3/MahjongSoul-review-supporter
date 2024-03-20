import "@/style.css"

import MjaiList from "./components/mjaiList"
import NagaList from "./components/nagaList"
import RecipeList from "./components/recipe"

function IndexPopup() {
  return (
    <>
      <div className="relative wide bg-mjsoul-bg-blue">
        <div className="flex flex-row">
          <div className="pl-4 pt-1 text-3xl text-mjsoul-text-gold hudetext">
            Review Supporter
          </div>
          <div className="text-base pl-4 pt-4 text-mjsoul-text-gold hudetext">
            v 2.0.0
          </div>
          <div className="absolute top-4 right-4"></div>
        </div>
        <div className="flex flex-wrap">
          <div className="w-full">
            <div className="mx-2">
              <div className="flex mb-4 px-1 min-w-0  break-words bg-mjsoul-fl-blue shadow-lg rounded-b-xl">
                <div className="w-3/5">
                  <NagaList></NagaList>
                </div>
                <div className="w-2/5">
                  <MjaiList></MjaiList>
                  <RecipeList></RecipeList>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default IndexPopup
