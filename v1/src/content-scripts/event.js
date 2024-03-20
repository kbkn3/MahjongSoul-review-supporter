window.addEventListener("message", function (event) {
    if (
        event.source == window &&
        event.data &&
        event.data.direction == "from-page-script"
    ) {
        console.log(
            '2.Content script received message: "' + event.data.message + '"'
        );
        GetTenholog();
    }
});

function GetTenholog() {
    app.NetAgent.sendReq2Lobby(
        "Lobby",
        "fetchGameRecord",
        {
            game_uuid: GameMgr.Inst.record_uuid,
            client_version_string: GameMgr.Inst.getClientVersion(),
        }, // anon edit 2
        function (i, record) {
            const results = parse(record);
            window.postMessage({ direction: "from-page", message: results }, "*");
        }
    );
}
