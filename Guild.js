// LiteLoader-AIDS automatic generated
/// <reference path="d:\SakuServer\LLlib/dts/helperlib/src/index.d.ts"/> 

ll.registerPlugin("Guild", "公会", [0, 0, 1], null);
const { StaticFloatingText, GMLIB, } = require("./GMLIB-LegacyRemoteCallApi/lib/GMLIB_API-JS");
let PATH = { root: `./plugins/Guild`, data: `./plugins/Guild/data`, };

// 获取cfg的内容，如果没找到config，创建新的config
let cfg = new JsonConfigFile(`${PATH.root}/config.json`, JSON.stringify({
    CreateCost: 6000,
}))

let msg = new JsonConfigFile(`${PATH.data}/msg.json`, JSON.stringify({}))

// 获取guilds的内容，如果没找到guilds，创建新的guilds
let guilds = new JsonConfigFile(`${PATH.data}/guilds.json`, JSON.stringify({}))
let playerData = new JsonConfigFile(`${PATH.data}/players.json`, JSON.stringify({}))
let xuidData = new JsonConfigFile(`${PATH.data}/xuid2name.json`, JSON.stringify({}))

// 公会插件
// 创建公会
// 选项:创建公会名称,创建公会据点
// 公会据点:需要玩家输入坐标，开启后公会玩家可快速传送，并在坐标点显示公会名称(悬浮字幕)
// 创建公会需支付6000经济

// 公会管理页面
// 1.打开公会仓库（初始内存60)可选择仓库扩容(内存120:500经济内存150:1000经济200内存:1500经济)权限管理:公会创建者(会长)可选择三种仓库权限（仅限会长使用)(仅限会长和管理员使用)(所有公会成员均可使用)也可以选择添加新的仓库（需支付1000经济，最高可创建三个)
// ⒉管理玩家公会创建者或管理员可自由传送玩家，查看玩家物品栏，或将玩家踢出公会3.添加公会管理员（仅限会长使用)使用时需输入玩家名称
// 4.入会条件公长或管理员可设置1所有玩家均可进入2需要想公会会长和管理员发送申请,成功后即可加入3需缴纳入会费（可自由设置,上线5000经济)缴纳后自动加入
// 5.解散公会(仅限会长)

// 玩家界面
// 1.玩家可通过使用道具打开公会界面选择加入公会，加入公会界面会显示当前所有公会以及公会的名称以及人数
// 2.打开仓库该界面会显示当前公会的所有仓库，玩家可自由存入或取出物品，如果权限不足则会显示【权限不足，无法打开】
// 3.公会频道加入公会的玩家可在此进行加密聊天，只有工会成员可见
// 4.传送到公会据点
// 5.退出公会

mc.listen("onServerStarted", () => {
    let cmd = mc.newCommand("guild", "公会", PermType.Any);
    cmd.setAlias("gh");
    cmd.overload();
    cmd.setCallback((_cmd, _ori, out, res) => {
        let pl = _ori.player;
        mainForm(pl)
    });
    cmd.setup();
});


function mainForm(pl) {

    if (!playerGuild_all(pl.xuid)) {
        // 无公会玩家的表单 创建/加入
        newGuildPlayerForm(pl);
        return;
    }

    switch (playerGuild_all(pl.xuid)["level"]) {
        case "master":
            masterForm(pl);
            break;
        case "admin":
            adminForm(pl);
            break;
        case "member":
            memberForm(pl);
            break;
        case "join":
            newGuildPlayerForm(pl);
            break;
    }
}

function playerGuild_all(xuid) {
    if (playerData.get(xuid) == null) return false;
    return playerData.get(xuid);
}

function memberForm(pl) {
    let fm = mc.newSimpleForm();
    fm.setTitle("公会");
    fm.setContent(`${GuildInfoToString(GuildInfo(pl.xuid))}`);
    fm.addButton("§l【回公会】\n§r传送到公会据点");
    fm.addButton("§l【传送玩家】\n§r传送到公会玩家");
    fm.addButton("§l【银行】\n§r公会银行");
    fm.addButton("§l【仓库】\n§r公会仓库");
    pl.sendForm(fm, memberForm_func)
}

function adminForm(pl) {
    let fm = mc.newSimpleForm();
    fm.setTitle("公会管理 管理员");
    fm.setContent(`${GuildInfoToString(GuildInfo(pl.xuid))}`);
    fm.addButton("§l【回公会】\n§r传送到公会据点"); // 差悬浮字
    fm.addButton("§l【传送玩家】\n§r传送到公会玩家");
    fm.addButton("§l【银行】\n§r公会银行");
    fm.addButton("§l【仓库】\n§r公会仓库");// 差仓库
    fm.addButton("§l【查包】\n§r查看玩家物品栏");// 差查包
    fm.addButton("§l【新加入】\n§r公会新玩家申请");
    fm.addButton("§l【踢出】\n§r踢出公会玩家");
    fm.addButton("§l【设置】\n§r设置公会");
    pl.sendForm(fm, adminForm_func)
}

function masterForm(pl) {
    let fm = mc.newSimpleForm();
    fm.setTitle("公会管理 会长");
    fm.setContent(`${GuildInfoToString(GuildInfo(pl.xuid))}`);
    fm.addButton("§l【回公会】\n§r传送到公会据点"); // 差悬浮字
    fm.addButton("§l【传送玩家】\n§r传送到公会玩家");
    fm.addButton("§l【银行】\n§r公会银行");
    fm.addButton("§l【仓库】\n§r公会仓库");// 差仓库
    fm.addButton("§l【查包】\n§r查看玩家物品栏");// 差查包
    fm.addButton("§l【新加入】\n§r公会新玩家申请");
    fm.addButton("§l【踢出】\n§r踢出公会玩家"); // 差踢出
    fm.addButton("§l【设置管理员】\n§r添加或取消公会管理员");
    fm.addButton("§l【设置】\n§r设置公会");
    fm.addButton("§l【解散】\n§r解散你的公会");  // 差解散/转让
    pl.sendForm(fm, masterForm_func)
}

function memberForm_func(pl, id) {
    return;
}
function adminForm_func(pl, id) {
    return;
}

function masterForm_func(pl, id) {
    if (id == null) return;

    switch (id) {
        case 0:
            // 传送到公会传送点
            tpGuildPoint(pl);
            break;
        case 1:
            // tp到公会玩家的身边
            tpGuildPlayer(pl);
            break;
        case 2:
            // 公会银行
            bankForm(pl);
            break;
        case 3:
            // 公会仓库
            pl.sendText("后续开发！");
            break;
        case 4:
            // 查包
            pl.sendText("后续开发！");
            break;
        case 5:
            // 审核新玩家加入
            auditJoin(pl);
            break;
        case 6:
            // 踢出玩家
            kick(pl);
            break;
        case 7:
            // 设置管理员
            adminSet(pl);
            break;
        case 8:
            // 设置公会
            setGuild(pl);
            break;
        default:
            break;
    }
}

function adminSet(pl) {
    let fm = mc.newSimpleForm();
    let adminList = GuildInfo(pl.xuid).admin;
    let memberList = GuildInfo(pl.xuid).member;
    fm.setTitle("设置管理员")
    adminList.forEach((xuid, index) => {
        fm.addButton(`[管理员] ${xuid2name(xuid)}`);
    });
    memberList.forEach((xuid, index) => {
        fm.addButton(`${xuid2name(xuid)}`);
    });

    pl.sendForm(fm, adminSet_func);
}

function adminSet_func(pl, id) {
    if (id == null) return adminForm(pl);
    let adminList = GuildInfo(pl.xuid).admin;
    let memberList = GuildInfo(pl.xuid).member;
    if (id < adminList.length) {
        let xuid = adminList[id];
        pl.sendModalForm("设置管理员", `你确定要将 ${xuid2name(xuid)} 的管理员权限变为成员权限吗？`, "确认", "取消", (pl, res) => {
            if (res == null || !res) return adminSet(pl);

            // 同意申请 将admin移动到member
            let info = GuildInfo(pl.xuid);
            info.admin.splice(id, 1);
            info.member.push(xuid); // 添加到member数组中

            let change = playerData.get(xuid)
            change.level = "member";
            playerData.set(xuid, change)

            // 更新公会信息在guilds中的存储
            guilds.set(playerData.get(pl.xuid)["Guid"], info);

            pl.sendText("更改成功！")
            return adminSet(pl);
        })
    } else {
        id = id - adminList.length;
        let xuid = memberList[id];
        pl.sendModalForm("设置管理员", `你确定要将 ${xuid2name(xuid)} 的成员权限变为管理员权限吗？`, "确认", "取消", (pl, res) => {
            if (res == null || !res) return adminSet(pl);

            // 同意申请 将admin移动到member
            let info = GuildInfo(pl.xuid);
            info.member.splice(id, 1);
            info.admin.push(xuid); // 添加到member数组中

            let change = playerData.get(xuid)
            change.level = "admin";
            playerData.set(xuid, change)

            // 更新公会信息在guilds中的存储
            guilds.set(playerData.get(pl.xuid)["Guid"], info);

            pl.sendText("更改成功！")
            return adminSet(pl);
        })
    }
}


function xuid2name(xuid) {
    return xuidData.get(xuid);
}


// 审核新玩家加入
function auditJoin(pl) {
    if (GuildInfo(pl.xuid).joinType != 0) {
        pl.sendText("您的公会加入模式非'需要审核后加入',该表单不可用！");
        return mainForm(pl);
    }
    let joinList = GuildInfo(pl.xuid).join;
    let fm = mc.newSimpleForm();
    fm.setTitle("传送到玩家");
    fm.setContent(`当前申请书： ${joinList.length}`);
    joinList.forEach((xuid, index) => {
        fm.addButton(xuid2name(xuid)); // 按钮的文本是玩家姓名
    });
    pl.sendForm(fm, auditJoin_func);
}

function auditJoin_func(pl, id) {
    if (id == null) return mainForm(pl);
    let xuid = GuildInfo(pl.xuid).join[id];

    pl.sendModalForm("加入审核", `${xuid}`, "审核通过", "拒绝申请", (pl, res) => {
        if (res == null) return mainForm(pl);

        if (res) {
            // 同意申请 将join移动到member
            let info = GuildInfo(pl.xuid);

            let xuidIndex = info.join.indexOf(xuid);  //找到index
            info.join.splice(xuidIndex, 1); // 从join数组中移除
            info.member.push(xuid); // 添加到member数组中
            let change = playerData.get(xuid)
            change.level = "member";
            playerData.set(xuid, change)
            // 更新公会信息在guilds中的存储
            guilds.set(playerData.get(pl.xuid)["Guid"], info);
            pl.sendForm("你通过了一项加入申请！")
        } else {
            let info = GuildInfo(pl.xuid);
            // 拒绝申请 删除join的xuid即可

            let xuidIndex = info.join.indexOf(xuid);  //找到index
            info.join.splice(xuidIndex, 1); // 从join数组中移除
            guilds.set(playerData.get(pl.xuid)["Guid"], info);

            // 删除玩家申请
            playerData.delete(xuid);

            let player = mc.getPlayer(xuid);

            pl.sendText("你拒绝了一项加入申请！");
            // 通知玩家
            if (player != null) {
                pl.sendModalForm("公会审核结果", "公会拒绝了你的申请！", "重新加入其他公会", "我了解了", (pl, res) => {
                    if (res) {
                        return mainForm(pl);
                    }
                })
            } else {
                msg.set(xuid, { type: "refuse", text: "公会拒绝了你的申请！" })
            }
        }
        return auditJoin(pl);
    })
}


function kick(pl) {
    let memberList = GuildInfo(pl.xuid).member;
    let fm = mc.newSimpleForm();
    fm.setTitle("踢出公会");
    fm.setContent(`你仅可以踢出非管理员成员\n当前非管理员的成员数： ${memberList.length}`);
    memberList.forEach((xuid, index) => {
        fm.addButton(xuid2name(xuid)); // 按钮的文本是玩家姓名
    });
    pl.sendForm(fm, kick_func);
}

function kick_func(pl, id) {
    if (id == null) return mainForm(pl);
    let memberList = GuildInfo(pl.xuid).member;

    pl.sendModalForm("真的要踢出Ta吗？", `${memberList[id]}`, "确认", "取消", (pl, res) => {
        if (res == null) return kick(pl);
        if (res) {
            let guid = playerData.get(pl.xuid)["Guid"];
            let guildInfo = guilds.get(guid);
            let index = id;
            guildInfo.member.splice(index, 1);
            guilds.set(guid, guildInfo);

            // 删除玩家信息
            playerData.delete(memberList[id]);
            pl.sendText("踢出成功");
        } else {
            return kick(pl);
        }
    })
}


mc.listen("onJoin", (pl) => {
    xuidData.set(pl.xuid, pl.realName);
    if (msg.get(pl.xuid)) {
        if (msg.get(pl.xuid).type == "refuse") {
            let text = msg.get(pl.xuid).text;
            pl.sendModalForm("公会审核结果", text, "重新加入其他公会", "我了解了", (pl, res) => {
                msg.delete(pl.xuid)
                if (res) {
                    return mainForm(pl);
                }
            })
        }
    }
})

function tpGuildPlayer(pl) {
    let playerNames = getGuildPlayerList(playerData.get(pl.xuid)["Guid"], true);
    let fm = mc.newSimpleForm();
    fm.setTitle("传送到玩家");
    fm.setContent(`当前公会在线玩家数： ${playerNames.length}`);
    playerNames.forEach((playerName, index) => {
        fm.addButton(playerName); // 按钮的文本是玩家姓名，值是玩家的索引  
    });
    pl.sendForm(fm, tpGuildPlayer_func);
}


function tpGuildPlayer_func(pl, id) {
    if (id == null) return mainForm(pl);
    let plList = getGuildPlayerList(playerData.get(pl.xuid)["Guid"]);
    if (plList[id].xuid == pl.xuid) {
        pl.sendText("如传，竟然传送到自己的位置！")
        return;
    }
    pl.teleport(plList[id].pos);
}


/**  
 * 获取公会中在线玩家的信息。  
 *  
 * @param {string} xuid 公会的 GUID。  
 * @param {boolean} [returnNamesOnly=false] 是否只返回玩家姓名。默认为 false，返回玩家对象。  
 * @returns {Object[]|string[]} 根据 returnNamesOnly 参数，返回玩家对象列表或姓名列表。  
 */
function getGuildPlayerList(guid, returnNamesOnly = false) {
    // 获得所有在线玩家列表  
    let onlinePlayers = mc.getOnlinePlayers(); // [<Player>,<Player>]  

    // 获得公会所有成员的 xuid 列表  
    let guildPlayersList = [];

    let guildInfo = guilds.get(guid);

    if (guildInfo && guildInfo["master"]) {
        guildPlayersList.push(guildInfo["master"].xuid);
    }
    if (guildInfo && guildInfo["admin"]) {
        guildPlayersList.push(...guildInfo["admin"]);
    }
    if (guildInfo && guildInfo["member"]) {
        guildPlayersList.push(...guildInfo["member"]);
    }

    // 过滤掉虚拟玩家  
    let realPlayerList = onlinePlayers.filter(p => !p.isSimulatedPlayer());

    // 过滤掉非公会的玩家  
    let guildOnlinePlayers = realPlayerList.filter(p => guildPlayersList.includes(p.xuid));

    if (returnNamesOnly) {
        return guildOnlinePlayers.map(p => p.realName);
    } else {
        return guildOnlinePlayers;
    }
}



function bankForm(pl) {
    let bank = GuildInfo(pl.xuid).bank.llmoney;
    let fm = mc.newCustomForm();
    fm.setTitle("公会银行");
    fm.addLabel(`银行余额： ${bank}\n你的余额： ${_getPlayerMoney(pl)}`)
    fm.addInput("存入", "需要存入多少钱");
    fm.addInput("取出", "需要取出多少钱");


    pl.sendForm(fm, (pl, data) => {
        if (data == null) return mainForm(pl);
        let Guid = playerData.get(pl.xuid)["Guid"];
        let count;
        let info = GuildInfo(pl.xuid);

        if (isNaN(data[1]) || isNaN(data[2])) {
            pl.sendText("请输入有效的数字！");
            return bankForm(pl);
        }

        // 存入
        if (data[1] - data[2] > 0) {
            count = data[1] - data[2];

            if (_getPlayerMoney(pl) < count) {
                pl.sendText("余额不足！");
                return bankForm(pl);
            }
            if (_removePlayerMoney(pl, count)) {
                info.bank.llmoney += count;
                guilds.set(Guid, info);
                pl.sendText(`成功存入${data[1] - data[2]}，你的余额变化${_getPlayerMoney(pl) + (data[1] - data[2])}->${_getPlayerMoney(pl)}`)
            }
        }

        // 取出
        if (data[1] - data[2] < 0) {
            count = data[2] - data[1];
            if (info.bank.llmoney < count) {
                pl.sendText("余额不足！");
                return bankForm(pl);
            }
            if (_addPlayerMoney(pl, count)) {
                info.bank.llmoney -= count;
                guilds.set(Guid, info);
                pl.sendText(`成功取出${data[2] - data[1]}，你的余额变化${_getPlayerMoney(pl) - (data[2] - data[1])}->${_getPlayerMoney(pl)}`)
            }
        }

    });
}

// 修改公会的信息
function setGuild(pl) {
    let guildInfo = GuildInfo(pl.xuid);
    let fm = mc.newCustomForm();
    fm.setTitle("公会设置");
    fm.addInput("公会名", "起一个简洁大方，独一无二的名字", guildInfo.name);
    fm.addInput("公会简介", "公会的简单介绍", guildInfo.text);
    fm.addDropdown("公会加入方式", ["需要审核后加入", "需要缴纳会费后加入", "直接加入"], guildInfo.joinType)
    fm.addInput("需要缴纳多少会费加入", "填写加入需要缴纳的会费", `${guildInfo.joinCost}`);
    fm.addSwitch(`[ §6不修改§r | §a修改§r ] 修改公会传送点\n修改前： ${guildInfo.tpPoint.x} ${guildInfo.tpPoint.y} ${guildInfo.tpPoint.z}\n修改后： ${pl.blockPos.x} ${pl.blockPos.y} ${pl.blockPos.z}`, false)
    pl.sendForm(fm, (pl, data) => {
        if (data == null) return mainForm(pl);

        if (isNaN(data[3])) {
            pl.sendText("请输入有效的数字！");
            return;
        }

        if (data[3] >= 5000) {
            pl.sendText("加入金额不得超过5000！")
            return;
        }
        setGuildInfo(pl, data);
    });
}

// 传送到公会传送点
function tpGuildPoint(pl) {
    let tpPoint = GuildInfo(pl.xuid)["tpPoint"];
    pl.teleport(tpPoint.x, tpPoint.y, tpPoint.z, tpPoint.dimid);
    pl.setTitle("欢迎回来！", 3);
    pl.setTitle(GuildInfo(pl.xuid).name, 2);
}


/**
 * 
 * @param {string} xuid 玩家xuid
 * @returns 公会信息
 */
function GuildInfo(xuid) {
    return guilds.get(playerData.get(xuid)["Guid"]);
}


// 新的公会玩家 创建或加入
function newGuildPlayerForm(pl) {
    let fm = mc.newSimpleForm();
    let ghList = JSON.parse(getGuildList());
    fm.setTitle("可加入的公会列表");
    fm.addButton("创建公会");
    for (let key in ghList) {
        fm.addButton(`${ghList[key].joinType == 2 ? "【无审核】" : ""}${ghList[key].name} §8§o#${ghList[key].master.name}\n§r§8${ghList[key].text}`)
    }
    pl.sendForm(fm, newGuildPlayerForm_func)
}

// 创建或加入公会
function newGuildPlayerForm_func(pl, id) {
    if (id == null) return;

    // 创建公会
    if (id == 0) {
        // 钱不够无法创建
        if (_getPlayerMoney(pl) < cfg.get('CreateCost')) {
            pl.sendText("金额不足！创建公会至少需要" + cfg.get('CreateCost'))
            return;
        }
        createGuildForm(pl);
        return;
    }

    // 加入公会
    // 选择的公会GUID
    let joinGuildGuid = Object.entries(JSON.parse(getGuildList()))[id - 1][0];
    if (playerData.get(pl.xuid) != null && playerData.get(pl.xuid).level == "join") {
        pl.sendModalForm("加入公会", `你已经申请了某个公会，你确定要重新申请公会吗？这会让之前的公会申请失效`, "确认重新申请", "取消", (pl, res) => {
            if (res) {
                // 删除公会信息
                let info = guilds.get(joinGuildGuid); // {join:["player1xuid"]}
                let index = info.join.findIndex(xuid => xuid === pl.xuid);
                info.join.splice(index, 1);
                guilds.set(joinGuildGuid, info);
                // 删除个人保存
                playerData.delete(pl.xuid);
                return joinGuild_mod(pl, joinGuildGuid);
            } else {
                return newGuildPlayerForm(pl);
            }
        })
    } else {
        joinGuild_mod(pl, joinGuildGuid);
    }
}

function joinGuild_mod(pl, guid) {
    let guidInfo = guilds.get(guid);
    // 确认加入的界面
    let joinType = ["需要审核后加入", "需要缴纳会费后加入", "直接加入"];
    pl.sendModalForm("加入公会", `公会名称： ${guidInfo.name}\n公会简介： ${guidInfo.text}\n公会会长： ${guidInfo.master.name}\n公会成员数： ${guidInfo.member.length + guidInfo.admin.length + 1}\n公会加入方式： ${joinType[guidInfo.joinType]}${guidInfo.joinType == 1 ? "§c 申请费用" + guidInfo.joinCost + "\n" : "\n"}`, "确认加入", "取消", (pl, res) => {
        if (res == false) return newGuildPlayerForm(pl);

        if (guidInfo.joinType == 0) {
            let info = guilds.get(guid);
            info.join.push(pl.xuid);
            guilds.set(guid, info);
            playerData.set(pl.xuid, {
                Guid: guid,
                level: "join"
            });
            pl.sendText("申请加入中,等待审核！")
        }

        if (guidInfo.joinType == 2) {
            let info = guilds.get(guid);
            info.member.push(pl.xuid);
            guilds.set(guid, info);
            playerData.set(pl.xuid, {
                Guid: guid,
                level: "member"
            });
            pl.sendText("加入成功！");
            return memberForm(pl);
        }

        if (guidInfo.joinType == 1) {
            if (_getPlayerMoney(pl) < guidInfo.joinCost) {
                pl.sendText("余额不足！");
                return newGuildPlayerForm(pl);
            }
            _removePlayerMoney(pl, guidInfo.joinCost);
            let info = guilds.get(guid);
            info.bank.llmoney += guidInfo.joinCost;
            info.member.push(pl.xuid);
            guilds.set(guid, info);
            playerData.set(pl.xuid, {
                Guid: guid,
                level: "member"
            });
            pl.sendText("加入成功！");
            return memberForm(pl);
        }
    })
}

function getGuildList() {
    return guilds.read();
}

function createGuildForm(pl) {
    let fm = mc.newCustomForm();
    fm.setTitle("创建公会");
    fm.addInput("公会名", "起一个简洁大方，独一无二的名字", `${pl.realName}的公会`);
    fm.addInput("公会简介", "公会的简单介绍", "一个朴实无华的公会");
    fm.addDropdown("公会加入方式", ["需要审核后加入", "需要缴纳会费后加入", "直接加入"], 0)
    fm.addInput("需要缴纳多少会费加入", "填写加入需要缴纳的会费", "0");
    pl.sendForm(fm, (pl, data) => {
        if (data == null) return;
        if (data[3] >= 5000) {
            pl.sendText("加入金额不得超过5000！")
            return;
        }
        _removePlayerMoney(pl, cfg.get('CreateCost'));
        createGuild(pl, data);
    });
}

function _getPlayerMoney(pl) {
    return pl.getMoney();
}

function _addPlayerMoney(pl, val) {
    return pl.addMoney(val);
}

function _removePlayerMoney(pl, val) {
    return pl.reduceMoney(val);
}

function createGuild(pl, data) {
    let Guid = system.randomGuid();

    let name = data[0];
    let text = data[1];
    let joinType = data[2]; // 加入方式 0审核 1缴费 2直接加入
    let joinCost = Number(data[3]); // 加入方式缴费所需要的金额

    let info = {
        name: name,
        text: text,
        joinType: joinType,
        joinCost: joinCost,
        master: {
            name: pl.name,
            xuid: pl.xuid
        },
        tpPoint: {
            x: pl.blockPos.x,
            y: pl.blockPos.y,
            z: pl.blockPos.z,
            dimid: pl.blockPos.dimid,
        },
        admin: [],
        member: [],
        bank: {
            llmoney: 0
        },
        join: []
    }

    // 保存公会信息
    guilds.set(Guid, info);

    // 在playerData标识公会会长
    playerData.set(pl.xuid, {
        Guid: Guid,
        level: "master"
    });

    pl.sendText(`${name} 创建成功!`)

    pl.sendModalForm("成功创建公会", `${GuildInfoToString(info)}`, "进入管理界面", "了解并关闭", (pl, res) => {
        if (res) {
            masterForm(pl);
        }
    })
}

function setGuildInfo(pl, data) {
    let Guid = playerData.get(pl.xuid)["Guid"];

    let name = data[0];
    let text = data[1];
    let joinType = data[2]; // 加入方式 0审核 1缴费 2直接加入
    let joinCost = Number(data[3]); // 加入方式缴费所需要的金额
    let tpPointIsChange = data[4]; // 是否修改tp点

    let info = GuildInfo(pl.xuid)

    info.name = name
    info.text = text
    info.joinType = joinType
    info.joinCost = joinCost

    if (tpPointIsChange) {
        info.tpPoint = {
            x: pl.blockPos.x,
            y: pl.blockPos.y,
            z: pl.blockPos.z,
            dimid: pl.blockPos.dimid,
        }
    }
    // 保存公会信息
    guilds.set(Guid, info);


    pl.sendText(`${name} 修改成功!`)

    pl.sendModalForm("成功创建公会", `${GuildInfoToString(info)}`, "进入管理界面", "了解并关闭", (pl, res) => {
        if (res) {
            masterForm(pl);
        }
    })
}


function GuildInfoToString(guidInfo) {
    let joinType = ["需要审核后加入", "需要缴纳会费后加入", "直接加入"]
    return `§r公会名： §r${guidInfo.name}\n§r公会简介：§r ${guidInfo.text}\n§r加入方式：§r ${joinType[guidInfo.joinType]}${guidInfo.joinType == 1 ? "§r " + guidInfo.joinCost + "\n" : "\n"}§r传送点：§r ${guidInfo.tpPoint.x} ${guidInfo.tpPoint.y} ${guidInfo.tpPoint.z}\n`
}