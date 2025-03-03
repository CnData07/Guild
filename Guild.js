// LiteLoader-AIDS automatic generated
/// <reference path="d:\SakuServer\LLlib/dts/helperlib/src/index.d.ts"/> 

// 注册插件
ll.registerPlugin("Guild", "公会", [1, 1, 2], null)

const { StaticFloatingText } = require("./GMLIB-LegacyRemoteCallApi/lib/GMLIB_API-JS")
const { PAPI } = require('./GMLIB-LegacyRemoteCallApi/lib/BEPlaceholderAPI-JS');
const Running = {}
// 定义默认路径
let PATH = { config: `./plugins/Guild/config`, data: `./plugins/Guild/data`, lang: `./plugins/Guild/lang` }

let hasFinalTexture = ll.listPlugins().includes('FinalTexture') // 是否有FinalTexture插件
if (hasFinalTexture) var getTexture = ll.imports("FinalTexture", "getTexture") // 有的话,导入获取texture函数

let cfg = new JsonConfigFile(
  `${PATH.config}/config.json`,
  JSON.stringify({
    CreateCost: 6000,
    maxJoinCost: 5000,
    openGui: "minecraft:slime_ball",
    chat: "#",
    chest: {
      max: 3,
      levelCost: [
        { cost: 1000, max: 100 },
        { cost: 1500, max: 120 },
        { cost: 2000, max: 150 },
        { cost: 2500, max: 200 },
      ],
    },
    toast: {
      error: "§c【 错误 】",
      succee: "§a【 成功 】",
      tip: "§6【 提示 】",
    },
  })
)

cfg.init("tpPointsMax", 5)
cfg.init("chatOpen", 0)

let msg = new JsonConfigFile(`${PATH.data}/msg.json`, JSON.stringify({}))
let guilds = new JsonConfigFile(`${PATH.data}/guilds.json`, JSON.stringify({}))
let transferGuilds = new JsonConfigFile(`${PATH.data}/null_guilds.json`, JSON.stringify({}))
let playerData = new JsonConfigFile(`${PATH.data}/players.json`, JSON.stringify({}))
let xuidData = new JsonConfigFile(`${PATH.data}/xuid2name.json`, JSON.stringify({}))
let floatingTextData = new JsonConfigFile(`${PATH.data}/StaticFloatingText.json`, JSON.stringify({}))
let chestData = new JsonConfigFile(`${PATH.data}/chestData.json`, JSON.stringify({}))
let itemKey = new JsonConfigFile(`${PATH.lang}/itemKey.json`, JSON.stringify({}))
let itemNameLang = new JsonConfigFile(`${PATH.lang}/itemName.json`, JSON.stringify({}))

// 防抖
let lastGuiOpenTime = 0 // 记录上一次打开GUI的时间
const debounceDelay = 500 // 防抖延迟

// 右击打开GUI
mc.listen("onUseItem", (pl, item) => {
  if (item.type == cfg.get("openGui")) {
    const currentTime = Date.now()
    if (currentTime - lastGuiOpenTime < debounceDelay) return
    lastGuiOpenTime = currentTime
    main_form(pl)
  }
})

// 公会聊天
mc.listen("onChat", (pl, msg) => {
  let open = cfg.get("chatOpen")
  if (open == 0) return;
  let prefix = cfg.get("chat")

  if (playerData.get(pl.xuid) && msg.startsWith(prefix)) {
    getGuildPlayerList(playerData.get(pl.xuid)["Guid"]).forEach((player) => {
      player.sendText(`§7[公会私聊] ${pl.realName} >> ${msg.replace(new RegExp(`^${prefix}`), "")}`) // 删除前缀
    })
  } else {
    mc.broadcast(`${pl.realName} >> ${msg}`)
  }

  return false
})

mc.listen("onServerStarted", () => {
  initFloatingText()

  let cmd = mc.newCommand("guild", "公会主菜单", PermType.Any)
  cmd.setAlias("gh")
  cmd.overload()
  cmd.setCallback((_cmd, _ori, out, res) => {
    let pl = _ori.player
    main_form(pl)
  })
  cmd.setup()
})

// 主菜单
function main_form(pl) {

  if (!playerData.get(pl.xuid)) {
    // 无公会玩家的表单 创建/加入
    newGuildPlayerForm(pl)
    return
  }
  switch (playerData.get(pl.xuid)["level"]) {
    case "master":
      masterForm(pl)
      break
    case "admin":
      adminForm(pl)
      break
    case "member":
      memberForm(pl)
      break
    case "join":
      newGuildPlayerForm(pl)
      break
  }
}

// 成员主菜单
function memberForm(pl) {
  let fm = mc.newSimpleForm()
  fm.setTitle("公会")
  fm.setContent(`${GuildInfoToString(GuildInfo(pl.xuid))}`)
  fm.addButton("【回公会】\n传送到公会据点", "textures/ui/saleribbon")
  fm.addButton("【传送玩家】\n传送到公会玩家", "textures/ui/sidebar_icons/my_characters")
  fm.addButton("【公会锚点】\n传送公会锚点", "textures/ui/sidebar_icons/realms")
  fm.addButton("【银行】\n公会银行", "textures/ui/icon_minecoin_9x9")
  fm.addButton("【仓库】\n公会仓库", "textures/blocks/ender_chest_front")
  fm.addButton("【赠送】\n向玩家赠送物品", "textures/ui/promo_gift_small_green")
  fm.addButton("【退出】\n退出公会", "textures/gui/newgui/Dot2")
  pl.sendForm(fm, (pl, id) => {
    if (id == null) return
    switch (id) {
      case 0:
        tpGuildPoint(pl)
        break
      case 1:
        tpGuildPlayer(pl)
        break
      case 2:
        tpGuildPoints(pl)
        break
      case 3:
        bankForm(pl)
        break
      case 4:
        chestList(pl)
        break
      case 5:
        giveItemTo(pl)
        break
      case 6:
        quitGuild(pl)
        break
    }
  })
}

// 管理员主菜单
function adminForm(pl) {
  let guid = playerData.get(pl.xuid)["Guid"]
  let newJoin = guilds.get(guid).join.length != 0 ? "§2有新玩家申请" : "公会新玩家申请"
  let fm = mc.newSimpleForm()
  fm.setTitle("公会管理 管理员")
  fm.setContent(`${GuildInfoToString(GuildInfo(pl.xuid))}`)
  fm.addButton("【回公会】\n传送到公会据点", "textures/ui/saleribbon")
  fm.addButton("【传送玩家】\n传送到公会玩家", "textures/ui/sidebar_icons/my_characters")
  fm.addButton("【公会锚点】\n传送公会锚点", "textures/ui/sidebar_icons/realms")
  fm.addButton("【银行】\n公会银行", "textures/ui/icon_minecoin_9x9")
  fm.addButton("【仓库】\n公会仓库", "textures/blocks/ender_chest_front")
  fm.addButton("【赠送】\n向玩家赠送物品", "textures/ui/promo_gift_small_green")
  fm.addButton(`【新加入】\n${newJoin}`, "textures/gui/newgui/Friends")
  fm.addButton("【踢出】\n踢出公会玩家", "textures/ui/friend_glyph_desaturated")
  fm.addButton("【设置】\n设置公会", "textures/gui/newgui/anvil-hammer")
  fm.addButton("【退出】\n退出公会", "textures/gui/newgui/Dot2")
  pl.sendForm(fm, (pl, id) => {
    if (id == null) return
    switch (id) {
      case 0:
        tpGuildPoint(pl)
        break
      case 1:
        tpGuildPlayer(pl)
        break
      case 2:
        tpGuildPoints(pl)
        break
      case 3:
        bankForm(pl)
        break
      case 4:
        chestList(pl)
        break
      case 5:
        giveItemTo(pl)
        break
      case 6:
        auditJoin(pl)
        break
      case 7:
        kick(pl)
        break
      case 8:
        setGuild(pl)
        break
      case 9:
        quitGuild(pl)
        break
    }
  })
}

// 会长主菜单
function masterForm(pl) {
  let guid = playerData.get(pl.xuid)["Guid"]
  let newJoin = guilds.get(guid).join.length != 0 ? "§2有新玩家申请" : "公会新玩家申请"
  let fm = mc.newSimpleForm()
  fm.setTitle("公会管理 会长")
  fm.setContent(`${GuildInfoToString(GuildInfo(pl.xuid))}`)
  fm.addButton("【回公会】\n传送到公会据点", "textures/ui/saleribbon")
  fm.addButton("【传送玩家】\n传送到公会玩家", "textures/ui/sidebar_icons/my_characters")
  fm.addButton("【公会锚点】\n传送公会锚点", "textures/ui/sidebar_icons/realms")
  fm.addButton("【银行】\n公会银行", "textures/ui/icon_minecoin_9x9")
  fm.addButton("【仓库】\n公会仓库", "textures/blocks/ender_chest_front")
  fm.addButton("【赠送】\n向玩家赠送物品", "textures/ui/promo_gift_small_green")
  fm.addButton(`【新加入】\n${newJoin}`, "textures/gui/newgui/Friends")
  fm.addButton("【踢出】\n踢出公会玩家", "textures/ui/friend_glyph_desaturated")
  fm.addButton("【设置管理员】\n添加或删除管理员", "textures/ui/op")
  fm.addButton("【设置】\n设置公会", "textures/gui/newgui/anvil-hammer")
  fm.addButton("【解散】\n解散你的公会", "textures/gui/newgui/Dot2")
  pl.sendForm(fm, (pl, id) => {
    if (id == null) return
    switch (id) {
      case 0:
        tpGuildPoint(pl)
        break
      case 1:
        tpGuildPlayer(pl)
        break
      case 2:
        tpGuildPoints(pl)
        break
      case 3:
        bankForm(pl)
        break
      case 4:
        chestList(pl)
        break
      case 5:
        giveItemTo(pl)
        break
      case 6:
        auditJoin(pl)
        break
      case 7:
        kick(pl)
        break
      case 8:
        adminSet(pl)
        break
      case 9:
        setGuild(pl)
        break
      case 10:
        disbandmentGuild(pl)
        break
    }
  })
}

// tpGuildPoints
function tpGuildPoints(pl) {
  let guid = playerData.get(pl.xuid)["Guid"]
  UpdateInit(pl, guid)


  let dimid = [
    "主世界",
    "地狱",
    "末地"
  ]
  let fm = mc.newSimpleForm()
  fm.setTitle("传送到公会锚点")
  guilds.get(guid).tpPoints.forEach(point => {
    fm.addButton(`${point.name}\n${dimid[point.pos.dimid]}(${point.pos.x} ${point.pos.y} ${point.pos.z})`, "textures/ui/sidebar_icons/realms")
  })

  if (playerData.get(pl.xuid)["level"] == "master") {
    fm.addButton(`编辑锚点`, "textures/ui/color_plus")

  }



  pl.sendForm(fm, (pl, id) => {
    if (id == null || id > guilds.get(guid).tpPoints.length) return main_form(pl)
    if (id == guilds.get(guid).tpPoints.length && (playerData.get(pl.xuid)["level"] == "master" || playerData.get(pl.xuid)["level"] == "admin")) {
      setPoints(pl)
    } else {
      let tp = guilds.get(guid).tpPoints[id].pos
      pl.teleport(tp.x, tp.y, tp.z, tp.dimid)
    }
  })
}

function setPoints(pl) {
  let guid = playerData.get(pl.xuid)["Guid"]
  let tpPoints = guilds.get(guid)["tpPoints"]

  let fm = mc.newCustomForm()
  fm.setTitle("设置公会锚点")

  fm.addInput(`§a§l【新建】 §r锚点名称 ${pl.blockPos}`, "输入锚点名称")

  let dimid = [
    "主世界",
    "地狱",
    "末地"
  ]

  let nameList = []
  tpPoints.forEach(point => {
    nameList.push(`${point.name} ${dimid[point.pos.dimid]}(${point.pos.x} ${point.pos.y} ${point.pos.z})`)
  })

  if (tpPoints.length > 0) {
    fm.addDropdown(`\n编辑锚点`, nameList)
    fm.addInput(`锚点名称`, "修改的锚点名称")
    fm.addSwitch(`[否 | 是] 删除该锚点`)
  }

  pl.sendForm(fm, (pl, data) => {
    if (data == null) return tpGuildPoints(pl)

    let newPoint = data[0] // 锚点名称

    // 如果填写了新建的锚点，那就新建
    if (newPoint) {
      if (guilds.get(guid).tpPoints.length >= cfg.get("tpPointsMax")) {
        pl.sendText(`§c已到达锚点上限值,公会最多拥有${cfg.get("tpPointsMax")}个锚点`)
        return tpGuildPoints(pl)
      }
      let guild = guilds.get(guid)
      let tpPoint = {
        name: newPoint,
        pos: {
          x: pl.blockPos.x,
          y: pl.blockPos.y,
          z: pl.blockPos.z,
          dimid: pl.blockPos.dimid
        }
      }
      guild.tpPoints.push(tpPoint)
      guilds.set(guid, guild)
    }

    if (data[3]) {
      let guild = guilds.get(guid)
      guild.tpPoints.splice(data[1], 1)
      guilds.set(guid, guild)
    }

    if (data[2]) {
      let guild = guilds.get(guid)
      guild.tpPoints[data[1]].name = data[2]
      guilds.set(guid, guild)
    }
    return tpGuildPoints(pl)
  })
}

// 退出公会
function quitGuild(pl) {
  let guid = playerData.get(pl.xuid)["Guid"]
  pl.sendModalForm("退出公会", "真的要退出公会吗？", "确认退出", "取消", (pl, res) => {
    if (res == null) return main_form(pl)
    if (res == true) {
      if (playerData.get(pl.xuid).level == "member") {
        let info = guilds.get(guid)
        let xuidIndex = info.member.indexOf(pl.xuid)
        info.member.splice(xuidIndex, 1)
        guilds.set(guid, info)
        playerData.delete(pl.xuid)
        return main_form(pl)
      }
      if (playerData.get(pl.xuid).level == "admin") {
        let info = guilds.get(guid)
        let xuidIndex = info.admin.indexOf(pl.xuid)
        info.admin.splice(xuidIndex, 1)
        guilds.set(guid, info)
        playerData.delete(pl.xuid)
        return main_form(pl)
      }
    } else {
      return main_form(pl)
    }
  })
}

function chestList(pl) {
  let guid = playerData.get(pl.xuid)["Guid"]
  let chestInfo = guilds.get(guid)["chest"]

  let fm = mc.newSimpleForm()
  fm.setTitle("仓库")

  chestInfo.forEach((chest, index) => {
    let openPermissions = ""
    if (chest.permissions.admin == true && chest.permissions.member == true) {
      openPermissions = "公会玩家均可使用"
    }
    if (chest.permissions.admin == false && chest.permissions.member == true) {
      openPermissions = "非管理员玩家可以使用"
    }
    if (chest.permissions.admin == false && chest.permissions.member == false) {
      openPermissions = "仅会长可用"
    }
    if (chest.permissions.admin == true && chest.permissions.member == false) {
      openPermissions = "仅会长与管理员可以使用"
    }
    fm.addButton(`${chest.name} ${getChestInfo(guid, index)}\n${openPermissions}`, "textures/blocks/chest_front")
  })

  if (chestInfo.length < cfg.get("chest")["max"]) {
    fm.addButton(`添加一个新仓库`, "textures/ui/color_plus")
  }

  pl.sendForm(fm, (pl, id) => {
    if (id == null) return main_form(pl)
    if (id < chestInfo.length) {
      // 打开仓库
      openChest(pl, id)
    } else {
      // 添加新仓库
      addChest(pl)
    }
  })
}

/**
 * 打开仓库
 * @param {*} pl 玩家
 * @param {*} chestId 仓库列表号
 */
function openChest(pl, chestId) {
  let guid = playerData.get(pl.xuid)["Guid"]
  let chestInfo = guilds.get(guid)["chest"][chestId]

  if (playerData.get(pl.xuid)["level"] == "admin" && chestInfo.permissions.admin == false) {
    pl.sendToast(cfg.get("toast")["error"], "权限不足!")
    return chestList(pl)
  }

  if (playerData.get(pl.xuid)["level"] == "member" && chestInfo.permissions.member == false) {
    pl.sendToast(cfg.get("toast")["error"], "权限不足!")
    return chestList(pl)
  }

  let fm = mc.newSimpleForm()
  fm.setTitle(`仓库 ${chestInfo.name}`)
  fm.setContent(`点击下方物品即可直接取出\n目前仓库容量： ${getChestInfo(guid, chestId)}`)

  if (playerData.get(pl.xuid)["level"] == "master") {
    fm.addButton("【设置仓库】", "textures/ui/mashup_PaintBrush") // 0
    fm.addButton("【扩容仓库】", "textures/ui/sidebar_icons/unowned_skins_icon") // 1
  }

  fm.addButton("【存入】", "textures/ui/free_download_symbol") // 2    0

  // 展示物品 3-n   id-3
  let itemList = chestData.get(guid)[chestId]
  itemList.forEach((snbt) => {
    let item = mc.newItem(NBT.parseSNBT(snbt))
    let Enchanted = item.isEnchanted ? "§d" : ""
    if (hasFinalTexture) {
      fm.addButton(`${Enchanted}${getName(item)} §rx${item.count}`, getTexture(item.type))
    } else {
      fm.addButton(`${Enchanted}${getName(item)} §rx${item.count}`)
    }
  })

  pl.sendForm(fm, (pl, id) => {
    if (id == null) return chestList(pl)

    if (playerData.get(pl.xuid)["level"] == "master") {
      if (id == 0) return setChest(pl, chestId)
      if (id == 1) return exChest(pl, chestId)
      if (id == 2) return inChest(pl, chestId)
      id = id - 3
    } else {
      if (id == 0) return inChest(pl, chestId)
      id = id - 1
    }

    let item = mc.newItem(NBT.parseSNBT(itemList[id]))
    let itemListx = chestData.get(guid)
    itemListx[chestId].splice(id, 1)
    pl.giveItem(item)
    chestData.set(guid, itemListx)
    return openChest(pl, chestId)
  })
}

function inChest(pl, chestId) {
  pl.refreshItems()
  let guid = playerData.get(pl.xuid)["Guid"]
  let fm = mc.newSimpleForm()
  fm.setTitle("存入物品")
  fm.setContent(`目前仓库容量： ${getChestInfo(guid, chestId)}`)

  let con = pl.getInventory()
  let items = getItems(con.getAllItems())

  // 如果背包空了就返回上一页面
  if (items.length == 0) {
    pl.sendToast(cfg.get("toast")["error"], "你背包已空，或者剩余物品无法进入仓库!")
    return openChest(pl, chestId)
  }

  for (let i = 0; i < items.length; i++) {
    let item = items[i]
    let Enchanted = item.isEnchanted ? "§d" : ""
    if (hasFinalTexture) {
      fm.addButton(`${Enchanted}${getName(item)} §rx${item.count}`, getTexture(item.type))
    } else {
      fm.addButton(`${Enchanted}${getName(item)} §rx${item.count}`)
    }
  }

  pl.sendForm(fm, (pl, id) => {
    if (id == null) return openChest(pl, chestId)
    if (getChestInfo(guid, chestId, true).have >= getChestInfo(guid, chestId, true).max) {
      pl.sendToast(cfg.get("toast")["tip"], "仓库容量已满,让管理员升级容量吧!")
      return openChest(pl, chestId)
    }

    let item = items[id] // 玩家所选择的item对象
    let snbt = item.getNbt().toSNBT()
    // if (mc.runcmdEx(`clear "${pl.name}" ${item.type} ${item.aux} ${item.count}`)) {
    if (item.setNull()) {
      pl.sendToast(
        cfg.get("toast")["succee"],
        `你成功存入了${item.isEnchanted ? "§d" : ""}${getName(item)} §rx${item.count}`
      )
      let itemList = chestData.get(guid)
      itemList[chestId].push(snbt)
      chestData.set(guid, itemList)
      return inChest(pl, chestId)
    } else {
      pl.sendToast(cfg.get("toast")["error"], "遇到错误！")
    }
  })
}

function exChest(pl, chestId) {
  let guid = playerData.get(pl.xuid)["Guid"]
  let nowLevel = guilds.get(guid)["chest"][chestId].level
  let maxLevel = cfg.get("chest")["levelCost"].length - 1

  if (nowLevel >= maxLevel) {
    pl.sendToast(cfg.get("toast")["tip"], "没有更高的等级啦！")
    return openChest(pl, chestId)
  }

  let levelUpCost = cfg.get("chest")["levelCost"][nowLevel + 1]["cost"]
  let levelUpMax = cfg.get("chest")["levelCost"][nowLevel + 1]["max"]

  pl.sendModalForm(
    "升级仓库",
    `目前仓库容量： ${getChestInfo(guid, chestId)}\n升级所需花费： ${levelUpCost}\n升级后容量： ${levelUpMax}`,
    "升级",
    "取消",
    (pl, res) => {
      if (res == false || res == null) return openChest(pl, chestId)
      if (res == true) {
        if (guilds.get(guid).bank.llmoney < levelUpCost) {
          pl.sendToast(cfg.get("toast")["tip"], "公会银行余额不够啦！")
          return chestList(pl)
        }

        let info = guilds.get(guid)
        info["chest"][chestId].level += 1
        info.bank.llmoney -= levelUpCost
        guilds.set(guid, info)
        pl.sendToast(cfg.get("toast")["succee"], "公会仓库升级成功！")
        return openChest(pl, chestId)
      }
    }
  )
}

function setChest(pl, chestId) {
  let guid = playerData.get(pl.xuid)["Guid"]
  let chestInfo = guilds.get(guid)["chest"][chestId]

  let fm = mc.newCustomForm()
  fm.setTitle("设置仓库")
  fm.addInput("仓库名", "起一个仓库的名字", chestInfo.name)
  fm.addSwitch("[关闭 | 开启] 管理员是否可以使用", chestInfo.permissions.admin)
  fm.addSwitch("[关闭 | 开启] 成员是否可以使用", chestInfo.permissions.member)

  pl.sendForm(fm, (pl, data) => {
    if (data == null) return chestList(pl)

    let name = data[0]
    let admin = data[1]
    let member = data[2]

    let info = guilds.get(guid)
    info["chest"][chestId].name = name
    info["chest"][chestId].permissions.admin = admin
    info["chest"][chestId].permissions.member = member

    guilds.set(guid, info)
    pl.sendToast(cfg.get("toast")["succee"], "成功修改仓库信息！")
    return chestList(pl)
  })
}

function addChest(pl) {
  let guid = playerData.get(pl.xuid)["Guid"]
  if (guilds.get(guid).bank.llmoney < cfg.get("chest")["levelCost"][0]["cost"]) {
    pl.sendToast(cfg.get("toast")["tip"], "公会银行余额不够啦！")
    return chestList(pl)
  }

  let fm = mc.newCustomForm()
  fm.setTitle("新增仓库")
  fm.addInput("仓库名", "起一个仓库的名字", "新仓库")
  fm.addSwitch("[关闭 | 开启] 管理员是否可以使用")
  fm.addSwitch("[关闭 | 开启] 成员是否可以使用")

  pl.sendForm(fm, (pl, data) => {
    if (data == null) return chestList(pl)
    if (guilds.get(guid).bank.llmoney < cfg.get("chest")["levelCost"][0]["cost"]) {
      pl.sendToast(cfg.get("toast")["tip"], "公会银行余额不够啦！")
      return chestList(pl)
    }

    let name = data[0]
    let admin = data[1]
    let member = data[2]

    let info = guilds.get(guid)
    info.chest.push({
      name: name,
      permissions: {
        admin: admin,
        member: member,
      },
      level: 0,
    })

    info.bank.llmoney = info.bank.llmoney - cfg.get("chest")["levelCost"][0]["cost"]
    guilds.set(guid, info)

    let itemList = chestData.get(guid)
    itemList.push([])
    chestData.set(guid, itemList)
    pl.sendToast(cfg.get("toast")["succee"], "成功创建新的仓库！")
    return chestList(pl)
  })
}

/**
 * 获取容量情况
 * @param {*} guid
 * @param {*} id
 * @returns
 */
function getChestInfo(guid, chestId, getInfo = false) {
  let have = chestData.get(guid)[chestId] ? chestData.get(guid)[chestId].length : 0
  let max = cfg.get("chest")["levelCost"][guilds.get(guid)["chest"][chestId]["level"]]["max"]
  if (getInfo) {
    return { have: have, max: max }
  } else {
    return `${have}/${max}`
  }
}

function disbandmentGuild(pl) {
  let guid = playerData.get(pl.xuid)["Guid"]

  let fm = mc.newSimpleForm()
  fm.setTitle("解散公会")
  fm.setContent(`真的要解散公会吗？会清理所有公会财产，包括但不限于仓库、银行，并且费用不会返还。`)
  fm.addButton(`转让公会`) // 0
  fm.addButton(`解散公会`) // 1
  fm.addButton(`取消`) // 2

  pl.sendForm(fm, (pl, id) => {
    if (id == null || id == 2) return main_form(pl)
    if (id == 0) return transferGuild(pl)

    if (id == 1) {
      pl.sendModalForm(
        "解散公会",
        "§c【高危操作】\n§r真的要解散公会吗？\n公会的任何财产将会全部失效！如果公会还有财产请清理后再解散！这次点击确认就是真的解散了！",
        "确认解散",
        "取消",
        (pl, res) => {
          if (res != true) return main_form(pl)
          // 所有信息全部保存到old
          let guid = playerData.get(pl.xuid)["Guid"]
          transferGuilds.set(guid, GuildInfo(pl.xuid))
          // 遍历playerData的所有属性
          for (let plXuid in JSON.parse(playerData.read())) {
            if (playerData.get(plXuid)["Guid"] == guid) {
              // 如果找到了匹配的Guid，那么从playerData中删除这个玩家
              playerData.delete(plXuid)
            }
          }
          guilds.delete(guid)
          delete_StaticFloatingText(guid)
          pl.sendToast(cfg.get("toast")["succee"], "公会已解散。")
        }
      )
    }
  })
}

function transferGuild(pl) {
  let fm = mc.newSimpleForm()
  let adminList = GuildInfo(pl.xuid).admin
  fm.setTitle("公会转让")
  fm.setContent("你仅能转让给公会管理员")
  adminList.forEach((xuid, index) => {
    fm.addButton(`${xuid2name(xuid)}`)
  })
  pl.sendForm(fm, transferGuild_func)
}

function transferGuild_func(pl, id) {
  if (id == null) return main_form(pl)
  let adminList = GuildInfo(pl.xuid).admin
  let xuid = adminList[id]

  pl.sendModalForm("转让公会", `你确定要将公会转让给 ${xuid2name(xuid)} 吗？`, "确认", "取消", (pl, res) => {
    if (res == null || !res) return main_form(pl)

    if (res) {
      // 同意申请 将admin移动到master
      let info = GuildInfo(pl.xuid)
      info.admin.splice(id, 1)
      info.admin.push(pl.xuid)
      info.master = {
        name: xuid2name(xuid),
        xuid: xuid,
      }

      let change = playerData.get(xuid)
      change.level = "master"
      playerData.set(xuid, change)

      let changeMaster = playerData.get(pl.xuid)
      changeMaster.level = "member"
      playerData.set(pl.xuid, changeMaster)

      // 更新公会信息在guilds中的存储
      guilds.set(playerData.get(pl.xuid)["Guid"], info)
      pl.sendToast(cfg.get("toast")["succee"], "转让成功！")
      return main_form(pl)
    } else {
      return main_form(pl)
    }
  })
}

function adminSet(pl) {
  let fm = mc.newSimpleForm()
  let adminList = GuildInfo(pl.xuid).admin
  let memberList = GuildInfo(pl.xuid).member
  fm.setTitle("设置管理员")
  adminList.forEach((xuid, index) => {
    fm.addButton(`[管理员] ${xuid2name(xuid)}`)
  })
  memberList.forEach((xuid, index) => {
    fm.addButton(`${xuid2name(xuid)}`)
  })

  pl.sendForm(fm, adminSet_func)
}

function adminSet_func(pl, id) {
  if (id == null) return main_form(pl)
  let adminList = GuildInfo(pl.xuid).admin
  let memberList = GuildInfo(pl.xuid).member
  if (id < adminList.length) {
    let xuid = adminList[id]
    pl.sendModalForm(
      "设置管理员",
      `你确定要将 ${xuid2name(xuid)} 的管理员权限变为成员权限吗？`,
      "确认",
      "取消",
      (pl, res) => {
        if (res == null || !res) return main_form(pl)

        // 同意申请 将admin移动到member
        let info = GuildInfo(pl.xuid)
        info.admin.splice(id, 1)
        info.member.push(xuid) // 添加到member数组中

        let change = playerData.get(xuid)
        change['level'] = "member"
        playerData.set(xuid, change)

        // 更新公会信息在guilds中的存储
        guilds.set(playerData.get(pl.xuid)["Guid"], info)
        pl.sendToast(cfg.get("toast")["succee"], "更改成功！")
        return adminSet(pl)
      }
    )
  } else {
    id = id - adminList.length
    let xuid = memberList[id]
    pl.sendModalForm(
      "设置管理员",
      `你确定要将 ${xuid2name(xuid)} 的成员权限变为管理员权限吗？`,
      "确认",
      "取消",
      (pl, res) => {
        if (res == null || !res) return adminSet(pl)

        // 同意申请 将admin移动到member
        let info = GuildInfo(pl.xuid)
        info.member.splice(id, 1)
        info.admin.push(xuid) // 添加到admin数组中

        let change = playerData.get(xuid)
        change.level = "admin"
        playerData.set(xuid, change)

        // 更新公会信息在guilds中的存储
        guilds.set(playerData.get(pl.xuid)["Guid"], info)
        pl.sendToast(cfg.get("toast")["succee"], "更改成功！")
        return adminSet(pl)
      }
    )
  }
}

// 审核新玩家加入
function auditJoin(pl) {
  if (GuildInfo(pl.xuid).joinType != 0) {
    pl.sendToast(cfg.get("toast")["tip"], "您的公会加入模式非'需要审核后加入',该表单不可用！")

    return main_form(pl)
  }
  let joinList = GuildInfo(pl.xuid).join
  let fm = mc.newSimpleForm()
  fm.setTitle("审核新玩家加入")
  fm.setContent(`当前申请书： ${joinList.length}`)
  joinList.forEach((xuid, index) => {
    fm.addButton(xuid2name(xuid)) // 按钮的文本是玩家姓名
  })
  pl.sendForm(fm, auditJoin_func)
}

function auditJoin_func(pl, id) {
  if (id == null) return main_form(pl)
  let xuid = GuildInfo(pl.xuid).join[id]
  let fm = mc.newSimpleForm()
  fm.setTitle("加入审核")
  fm.setContent(`\n正在审核申请加入公会的玩家\n玩家姓名： ${xuid2name(xuid)}\n `)
  fm.addButton("审核通过") // 0
  fm.addButton("拒绝申请") // 1
  fm.addButton("取消(等会处理)") // 2

  pl.sendForm(fm, (pl, res) => {
    if (res === null || res == 2) return auditJoin(pl)

    if (res == 0) {
      // 同意申请 将join移动到member
      let info = GuildInfo(pl.xuid)

      let xuidIndex = info.join.indexOf(xuid) //找到index
      info.join.splice(xuidIndex, 1) // 从join数组中移除
      info.member.push(xuid) // 添加到member数组中
      let change = playerData.get(xuid)
      change.level = "member"
      playerData.set(xuid, change)
      // 更新公会信息在guilds中的存储
      guilds.set(playerData.get(pl.xuid)["Guid"], info)
      pl.sendToast(cfg.get("toast")["succee"], "你通过了一项加入申请！")
    }
    if (res == 1) {
      let info = GuildInfo(pl.xuid)
      // 拒绝申请 删除join的xuid即可

      let xuidIndex = info.join.indexOf(xuid) //找到index
      info.join.splice(xuidIndex, 1) // 从join数组中移除
      guilds.set(playerData.get(pl.xuid)["Guid"], info)

      // 删除玩家申请
      playerData.delete(xuid)

      let player = mc.getPlayer(xuid)
      pl.sendToast(cfg.get("toast")["tip"], "你拒绝了一项加入申请！")
      // 通知玩家
      if (player != null) {
        player.sendModalForm("公会审核结果", "公会拒绝了你的申请！", "重新加入其他公会", "我了解了", (pl, res) => {
          if (res) {
            return main_form(pl)
          }
        })
      } else {
        msg.set(xuid, { type: "refuse", text: "公会拒绝了你的申请！" })
      }
    }

    return auditJoin(pl)
  })
}

function kick(pl) {
  let memberList = GuildInfo(pl.xuid).member
  let fm = mc.newSimpleForm()
  fm.setTitle("踢出公会")
  fm.setContent(`你仅可以踢出非管理员成员\n当前非管理员的成员数： ${memberList.length}`)
  memberList.forEach((xuid, index) => {
    fm.addButton(xuid2name(xuid)) // 按钮的文本是玩家姓名
  })
  pl.sendForm(fm, kick_func)
}

function kick_func(pl, id) {
  if (id == null) return main_form(pl)
  let memberList = GuildInfo(pl.xuid).member

  pl.sendModalForm("真的要踢出Ta吗？", `${xuid2name(memberList[id])}`, "确认", "取消", (pl, res) => {
    if (res == null) return kick(pl)
    if (res) {
      let guid = playerData.get(pl.xuid)["Guid"]
      let guildInfo = guilds.get(guid)
      let index = id
      guildInfo.member.splice(index, 1)
      guilds.set(guid, guildInfo)

      // 删除玩家信息
      playerData.delete(memberList[id])
      pl.sendToast(cfg.get("toast")["succee"], "踢出成功")
    } else {
      return kick(pl)
    }
  })
}

mc.listen("onJoin", (pl) => {
  xuidData.set(pl.xuid, pl.realName)
  if (msg.get(pl.xuid)) {
    if (msg.get(pl.xuid).type == "refuse") {
      let text = msg.get(pl.xuid).text
      pl.sendModalForm("公会审核结果", text, "重新加入其他公会", "我了解了", (pl, res) => {
        msg.delete(pl.xuid)
        if (res) {
          return main_form(pl)
        }
      })
    }
  }
})

function giveItemTo(pl) {
  let playerList = getGuildPlayerList(playerData.get(pl.xuid)["Guid"], false)
  let fm = mc.newSimpleForm()
  fm.setTitle("赠送物品")
  fm.setContent(`你只可以赠送在线玩家\n当前公会在线玩家数： ${playerList.length}`)
  playerList.forEach((pl, index) => {
    fm.addButton(pl.realName) // 按钮的文本是玩家姓名，值是玩家的索引
  })

  pl.sendForm(fm, (pl, id) => {
    if (id == null) return main_form(pl)
    let givePlayer = playerList[id]

    if (givePlayer.realName == pl.realName) {
      pl.sendToast(cfg.get("toast")["tip"], "不可以赠送给自己噢！")
      return giveItemTo(pl)
    }

    let fm = mc.newSimpleForm()
    fm.setTitle(`赠送`)
    fm.setContent(`点击下面的物品，将物品赠送给： ${givePlayer.realName}`)
    let con = pl.getInventory()
    let items = getItems(con.getAllItems())

    if (items.length == 0) {
      pl.sendToast(cfg.get("toast")["tip"], "你背包已空，或者剩余物品无法通过该方式赠送！")
      return giveItemTo(pl)
    }

    for (let i = 0; i < items.length; i++) {
      let item = items[i]
      let Enchanted = item.isEnchanted ? "§d" : ""
      fm.addButton(`${Enchanted}${getName(item)} §rx${item.count}`)
    }

    pl.sendForm(fm, (pl, id) => {
      if (id == null) return giveItemTo(pl)
      let item = items[id] // 玩家所选择的item对象 深拷贝
      givePlayer.sendText(`${pl.realName} 向你赠送了 ${getName(item)}`)
      pl.sendToast(cfg.get("toast")["succee"], `你赠送了 ${getName(item)} 给 ${givePlayer.realName}`)
      giveItemToPlayer(pl, givePlayer, item)

      return giveItemTo(pl)
    })
  })
}

function giveItemToPlayer(pl1, pl2, item) {
  let snbt = item.getNbt().toSNBT()
  if (item.setNull()) {
    let itemx = mc.newItem(NBT.parseSNBT(snbt))
    pl2.giveItem(itemx)
  } else {
    pl1.sendToast(cfg.get("toast")["error"], "遇到错误！")
  }
}

function tpGuildPlayer(pl) {
  let plList = getGuildPlayerList(playerData.get(pl.xuid)["Guid"])
  let fm = mc.newSimpleForm()
  fm.setTitle("传送到玩家")
  fm.setContent(`当前公会在线玩家数： ${plList.length}`)
  plList.forEach((pl, index) => {
    fm.addButton(pl.realName) // 按钮的文本是玩家姓名，值是玩家的索引
  })
  pl.sendForm(fm, (pl, id) => {
    if (id == null) return main_form(pl)

    if (plList[id].xuid == pl.xuid) {
      pl.sendText("如传，竟然传送到自己的位置！")
      return
    }
    pl.teleport(plList[id].pos)
  })
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
  let onlinePlayers = mc.getOnlinePlayers() // [<Player>,<Player>]

  // 获得公会所有成员的 xuid 列表
  let guildPlayersList = []

  let guildInfo = guilds.get(guid)

  if (guildInfo && guildInfo["master"]) {
    guildPlayersList.push(guildInfo["master"].xuid)
  }
  if (guildInfo && guildInfo["admin"]) {
    guildPlayersList.push(...guildInfo["admin"])
  }
  if (guildInfo && guildInfo["member"]) {
    guildPlayersList.push(...guildInfo["member"])
  }

  // 过滤掉虚拟玩家
  let realPlayerList = onlinePlayers.filter((p) => !p.isSimulatedPlayer())

  // 过滤掉非公会的玩家
  let guildOnlinePlayers = realPlayerList.filter((p) => guildPlayersList.includes(p.xuid))

  if (returnNamesOnly) {
    return guildOnlinePlayers.map((p) => p.realName)
  } else {
    return guildOnlinePlayers
  }
}

function bankForm(pl) {
  let bank = GuildInfo(pl.xuid).bank.llmoney
  let fm = mc.newCustomForm()
  fm.setTitle("公会银行")
  fm.addLabel(`§b 公会资金 §a| §7${bank}\n§b 玩家资金 §a| §7${_getPlayerMoney(pl)}\n`)
  fm.addInput("§a存入", "需要存入多少钱")
  if (playerData.get(pl.xuid).level == "admin" || playerData.get(pl.xuid).level == "master") {
    fm.addInput("§c取出", "需要取出多少钱")
  }

  pl.sendForm(fm, (pl, data) => {
    if (data == null) return main_form(pl)
    let guid = playerData.get(pl.xuid)["Guid"]
    let count
    let info = GuildInfo(pl.xuid)

    let add = data[1]
    let reduce

    if (data.length == 2) {
      reduce = 0
    } else {
      reduce = data[2]
    }

    if (isNaN(add) || isNaN(reduce)) {
      pl.sendToast(cfg.get("toast")["error"], "请输入有效的数字！")
      return bankForm(pl)
    }

    if (add < 0 || reduce < 0 || add - reduce == 0) {
      pl.sendToast(cfg.get("toast")["error"], "请输入有效的数字！")
      return bankForm(pl)
    }

    // 存入
    if (add - reduce > 0) {
      count = add - reduce

      if (_getPlayerMoney(pl) < count) {
        pl.sendToast(cfg.get("toast")["tip"], "余额不足！")
        return main_form(pl)
      }
      if (_removePlayerMoney(pl, count)) {
        info.bank.llmoney += count
        guilds.set(guid, info)
        pl.sendText(bankBill(pl, guid, count))
        return main_form(pl)
      }
    }

    // 取出
    if (add - reduce < 0) {
      count = reduce - add
      if (info.bank.llmoney < count) {
        pl.sendToast(cfg.get("toast")["tip"], "余额不足！")
        return bankForm(pl)
      }
      if (_addPlayerMoney(pl, count)) {
        info.bank.llmoney -= count
        guilds.set(guid, info)
        pl.sendText(bankBill(pl, guid, -count))
      }
    }
  })
}

function bankBill(pl, guid, money) {
  let info = GuildInfo(pl.xuid)
  let bill = ""
  if (money > 0) {
    bill += "§a========= 公会银行存入账单 =========§r\n"
    bill += `§a││§b 出票玩家 §a| §7${pl.realName}\n`
    bill += `§a││§b 收款公会 §a| §7${info.name}§r\n`
    bill += `§a││§b 账单金额 §a| §a${money}\n`
    bill += `§a││§b 玩家资金 §a| §7${_getPlayerMoney(pl)}\n`
    bill += `§a││§b 公会资金 §a| §7${info.bank.llmoney}\n`
    bill += "§a=====================================§r"
  } else {
    bill += "§c========= 公会银行取出账单 =========\n"
    bill += `§c││§b 出票公会 §c| §7${info.name}§r\n`
    bill += `§c││§b 收款玩家 §c| §7${pl.realName}\n`
    bill += `§c││§b 账单金额 §c| §c${money}\n`
    bill += `§c││§b 玩家资金 §c| §7${_getPlayerMoney(pl)}\n`
    bill += `§c││§b 公会资金 §c| §7${info.bank.llmoney}\n`
    bill += "§c=====================================§r"
  }
  return bill
}

// 修改公会的信息
function setGuild(pl) {
  let guildInfo = GuildInfo(pl.xuid)
  let guid = playerData.get(pl.xuid)["Guid"]
  UpdateInit(pl, guid)
  let fm = mc.newCustomForm()
  fm.setTitle("公会设置")
  fm.addInput("公会名", "起一个简洁大方，独一无二的名字", guildInfo.name)
  fm.addInput("公会简介", "公会的简单介绍", guildInfo.text)
  fm.addDropdown("公会加入方式", ["需要审核后加入", "需要缴纳会费后加入", "直接加入"], guildInfo.joinType)
  fm.addInput("需要缴纳多少会费加入", "填写加入需要缴纳的会费", `${guildInfo.joinCost}`)
  fm.addInput("公会聊天前缀（中英文1-4字符）", "填写公会聊天前缀", `${guildInfo.chatTitle}`)
  fm.addSwitch(
    `[ §6不修改§r | §a修改§r ] 修改公会传送点\n修改前： ${parseInt(guildInfo.tpPoint.x)} ${parseInt(
      guildInfo.tpPoint.y
    )} ${parseInt(guildInfo.tpPoint.z)}\n修改后： ${parseInt(pl.pos.x)} ${parseInt(pl.pos.y)} ${parseInt(pl.pos.z)}`,
    false
  )

  pl.sendForm(fm, (pl, data) => {
    if (data == null) return main_form(pl)

    if (isNaN(data[3])) {
      pl.sendToast(cfg.get("toast")["error"], "请输入有效的数字！")
      return setGuild(pl)
    }

    if (!isValidText(data[4]) && guildInfo.chatTitle != data[4]) {
      pl.sendToast(cfg.get("toast")["error"], `公会名称不合法！`)
      return setGuild(pl)
    }

    setGuildInfo(pl, data)
  })
}
function isValidText(text) {
  // 去除首尾空格并检查是否为空  
  if (!text || text.trim() === '') {
    return false;
  }

  // 计算中英文字符数  
  let chineseCharCount = 0; // 中文字符数  
  let englishCharCount = 0; // 英文字符数（两个英文字符算作一个）  

  // 遍历字符串中的每个字符  
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i);

    // 判断是否为中文字符  
    if (charCode >= 0x4e00 && charCode <= 0x9fa5) {
      chineseCharCount++;
      // 一个中文字符算作一个  
      if (chineseCharCount + Math.ceil(englishCharCount / 2) > 4) {
        return false;
      }
    }
    // 判断是否为英文字符  
    else if ((charCode >= 0x61 && charCode <= 0x7a) || // 小写字母  
      (charCode >= 0x41 && charCode <= 0x5a)) { // 大写字母  
      englishCharCount++;
      // 两个英文字符算作一个中文字符的位置  
      if (chineseCharCount + Math.ceil(englishCharCount / 2) > 4) {
        return false;
      }
    }
    // 其他字符均视为非法  
    else {
      return false;
    }
  }

  // 如果通过所有检查，返回true  
  return true;
}
// 传送到公会传送点
function tpGuildPoint(pl) {
  let tpPoint = GuildInfo(pl.xuid)["tpPoint"]
  pl.teleport(tpPoint.x, tpPoint.y, tpPoint.z, tpPoint.dimid)
  pl.setTitle("欢迎回来！", 3)
  pl.setTitle(GuildInfo(pl.xuid).name, 2)
}

// 新的公会玩家 创建或加入
function newGuildPlayerForm(pl) {
  let fm = mc.newSimpleForm()
  let ghList = JSON.parse(guilds.read())
  fm.setTitle("可加入的公会列表")
  fm.addButton("创建公会", "textures/ui/color_plus")
  for (let key in ghList) {
    fm.addButton(
      `${ghList[key].joinType == 2 ? "【无审核】" : ""}${ghList[key].name} §8§o#${ghList[key].master.name}\n§r§8${ghList[key].text
      }`
    )
  }
  pl.sendForm(fm, newGuildPlayerForm_func)
}

// 创建或加入公会
function newGuildPlayerForm_func(pl, id) {
  if (id == null) return

  // 创建公会
  if (id == 0) {
    // 钱不够无法创建
    if (_getPlayerMoney(pl) < cfg.get("CreateCost")) {
      pl.sendToast(cfg.get("toast")["error"], `金额不足！创建公会至少需要 ${cfg.get("CreateCost")} `)
      return
    }
    createGuildForm(pl)
    return
  }

  // 加入公会
  // 选择的公会GUID
  let joinGuildGuid = Object.entries(JSON.parse(guilds.read()))[id - 1][0]
  if (playerData.get(pl.xuid) != null && playerData.get(pl.xuid).level == "join") {
    pl.sendModalForm(
      "加入公会",
      `你已经申请了某个公会，你确定要重新申请公会吗？这会让之前的公会申请失效`,
      "确认重新申请",
      "取消",
      (pl, res) => {
        if (res) {
          // 删除公会信息
          let info = guilds.get(joinGuildGuid) // {join:["player1xuid"]}
          let index = info.join.findIndex((xuid) => xuid == pl.xuid)
          info.join.splice(index, 1)
          guilds.set(joinGuildGuid, info)
          // 删除个人保存
          playerData.delete(pl.xuid)
          return joinGuild_mod(pl, joinGuildGuid)
        } else {
          return main_form(pl)
        }
      }
    )
  } else {
    joinGuild_mod(pl, joinGuildGuid)
  }
}

function joinGuild_mod(pl, guid) {
  let guidInfo = guilds.get(guid)
  // 确认加入的界面
  let joinType = ["需要审核后加入", "需要缴纳会费后加入", "直接加入"]
  pl.sendModalForm(
    "加入公会",
    `公会名称： ${guidInfo.name}\n§r公会简介： ${guidInfo.text}\n§r公会会长： ${guidInfo.master.name}\n§r公会成员数： ${guidInfo.member.length + guidInfo.admin.length + 1
    }\n公会加入方式： ${joinType[guidInfo.joinType]}${guidInfo.joinType == 1 ? "§c 申请费用" + guidInfo.joinCost + "\n" : "\n"
    }`,
    "确认加入",
    "取消",
    (pl, res) => {
      if (res == false || res == null) return main_form(pl)

      if (guidInfo.joinType == 0) {
        let info = guilds.get(guid)
        info.join.push(pl.xuid)
        guilds.set(guid, info)
        playerData.set(pl.xuid, {
          Guid: guid,
          level: "join",
        })
        pl.sendText("申请加入中,等待审核！")
      }

      if (guidInfo.joinType == 2) {
        let info = guilds.get(guid)
        info.member.push(pl.xuid)
        guilds.set(guid, info)
        playerData.set(pl.xuid, {
          Guid: guid,
          level: "member",
        })
        pl.sendToast(cfg.get("toast")["succee"], "加入成功！")
        return main_form(pl)
      }

      if (guidInfo.joinType == 1) {
        if (_getPlayerMoney(pl) < guidInfo.joinCost) {
          pl.sendToast(cfg.get("toast")["error"], "余额不足！")
          return main_form(pl)
        }
        _removePlayerMoney(pl, guidInfo.joinCost)
        let info = guilds.get(guid)
        info.bank.llmoney += guidInfo.joinCost
        info.member.push(pl.xuid)
        guilds.set(guid, info)
        playerData.set(pl.xuid, {
          Guid: guid,
          level: "member",
        })
        pl.sendToast(cfg.get("toast")["succee"], "加入成功！")
        return main_form(pl)
      }
    }
  )
}

function createGuildForm(pl) {
  let fm = mc.newCustomForm()
  fm.setTitle("创建公会")
  fm.addInput("公会名", "起一个简洁大方，独一无二的名字", `${pl.realName}的公会`)
  fm.addInput("公会简介", "公会的简单介绍", "一个朴实无华的公会")
  fm.addDropdown("公会加入方式", ["需要审核后加入", "需要缴纳会费后加入", "直接加入"], 0)
  fm.addInput("需要缴纳多少会费加入", "填写加入需要缴纳的会费", "0")
  pl.sendForm(fm, (pl, data) => {
    if (data == null) return
    if (data[3] >= cfg.get("maxJoinCost")) {
      pl.sendToast(cfg.get("toast")["succee"], `加入金额不得超过${cfg.get("maxJoinCost")}！`)
      return
    }
    _removePlayerMoney(pl, cfg.get("CreateCost"))
    createGuild(pl, data)
  })
}

// 创建公会
function createGuild(pl, data) {
  let guid = system.randomGuid()

  let name = data[0]
  let text = data[1]
  let joinType = data[2] // 加入方式 0审核 1缴费 2直接加入
  let joinCost = Number(data[3]) // 加入方式缴费所需要的金额

  let info = {
    name: name,
    text: text,
    joinType: joinType,
    joinCost: joinCost,
    chatTitle: "未设置公会称号",
    chest: [],
    master: {
      name: pl.name,
      xuid: pl.xuid,
    },
    tpPoint: {
      x: pl.pos.x,
      y: pl.pos.y,
      z: pl.pos.z,
      dimid: pl.pos.dimid,
    },
    admin: [],
    member: [],
    bank: {
      llmoney: 0,
    },
    join: [],
  }

  // 保存公会信息
  guilds.set(guid, info)

  // 仓库信息
  chestData.set(guid, [])

  // 在playerData标识公会会长
  playerData.set(pl.xuid, {
    Guid: guid,
    level: "master",
  })

  create_StaticFloatingText(guid, pl.pos, `§e【传送点】§r\n${info.name}\n${info.text}`)
  pl.sendToast(cfg.get("toast")["succee"], `${name} 创建成功!`)

  pl.sendModalForm("成功创建公会", `${GuildInfoToString(info)}`, "进入管理界面", "了解并关闭", (pl, res) => {
    if (res) {
      initFloatingText()
      return main_form(pl)
    }
  })
}

// 设置公会
function setGuildInfo(pl, data) {
  let guid = playerData.get(pl.xuid)["Guid"]

  let name = data[0]
  let text = data[1]
  let joinType = data[2] // 加入方式 0审核 1缴费 2直接加入
  let joinCost = Number(data[3]) // 加入方式缴费所需要的金额
  let chatTitle = data[4] // 是否修改tp点
  let tpPointIsChange = data[5] // 是否修改tp点

  let info = GuildInfo(pl.xuid)

  info.name = name
  info.text = text
  info.joinType = joinType
  info.joinCost = joinCost
  info.chatTitle = chatTitle

  if (tpPointIsChange) {
    info.tpPoint = {
      x: pl.pos.x,
      y: pl.pos.y,
      z: pl.pos.z,
      dimid: pl.pos.dimid,
    }
    delete_StaticFloatingText(guid)
    create_StaticFloatingText(guid, pl.pos, `§e【传送点】§r\n${info.name}\n${info.text}`)
  }

  // 保存公会信息
  guilds.set(guid, info)
  pl.sendToast(cfg.get("toast")["succee"], `${name} 修改成功!`)
  pl.sendModalForm("成功设置公会", `${GuildInfoToString(info)}`, "进入管理界面", "了解并关闭", (pl, res) => {
    if (res) {
      return main_form(pl)
    }
  })
}

/**
 * 获取物品的中文名
 * @param {*} obj
 * @returns
 */
function getName(obj) {
  if (typeof obj != "string") {
    if (itemKey.get(obj.name) == null) return obj.name
    return itemNameLang.get(itemKey.get(obj.name)) ?? obj.name
  } else {
    return itemNameLang.get(itemKey.get(obj)) ?? obj
  }
}

/**
 * 获取物品是否被锁定
 * @param {*} item
 * @returns
 */
function itemHaveLock(item) {
  if (item.getNbt().getKeys().indexOf("tag") == -1) return false
  let tag = item.getNbt().getTag("tag").getKeys()

  if (tag.indexOf("minecraft:item_lock") != -1) return true

  return false
}
/**
 * 将玩家的xuid转为name
 * @param {*} xuid
 * @returns
 */
function xuid2name(xuid) {
  return xuidData.get(xuid)
}

/**
 * 获取所有物品
 * @param {*} items
 * @returns
 */
function getItems(items) {
  let allItems = []
  for (let key = 0; key < items.length; key++) {
    if (itemHaveLock(items[key])) {
      continue
    }

    if (items[key].isNull()) {
      continue
    }

    allItems.push(items[key])
  }
  return allItems
}

/**
 *
 * @param {string} xuid 玩家xuid
 * @returns 公会信息
 */
function GuildInfo(xuid) {
  return guilds.get(playerData.get(xuid)["Guid"])
}

/**
 * 获取玩家money
 * @param {*} pl
 * @returns
 */
function _getPlayerMoney(pl) {
  return pl.getMoney()
}

/**
 * 增加玩家moeny
 * @param {*} pl
 * @param {*} val
 * @returns
 */
function _addPlayerMoney(pl, val) {
  return pl.addMoney(val)
}

/**
 * 减少玩家money
 * @param {*} pl
 * @param {*} val
 * @returns
 */
function _removePlayerMoney(pl, val) {
  return pl.reduceMoney(val)
}

/**
 * 格式化公会信息
 * @param {*} guidInfo
 * @returns
 */
function GuildInfoToString(guidInfo) {
  let joinType = ["需要审核后加入", "需要缴纳会费后加入", "直接加入"]
  return `§r公会名： §r${guidInfo.name}\n§r公会简介：§r ${guidInfo.text}\n§r加入方式：§r ${joinType[guidInfo.joinType]
    }${guidInfo.joinType == 1 ? "§r " + guidInfo.joinCost + "\n" : "\n"}§r传送点：§r ${parseInt(
      guidInfo.tpPoint.x
    )} ${parseInt(guidInfo.tpPoint.y)} ${parseInt(guidInfo.tpPoint.z)}\n`
}

//服务端启动后初始化所有的静态字
function initFloatingText() {
  for (const uuid in Running) {
    let staticFloatingText = Running[uuid]
    staticFloatingText.destroy()
    delete Running[uuid]
  }
  let guids = Object.keys(JSON.parse(floatingTextData.read()))

  let staitc_fts = guids
  for (let guid in staitc_fts) {
    let json_data = floatingTextData.get(staitc_fts[guid])
    let pos = new FloatPos(json_data.pos.x, json_data.pos.y, json_data.pos.z, json_data.pos.dimid)
    create_StaticFloatingText(staitc_fts[guid], pos, json_data.text, true)
  }
}

/**
 * 创建悬浮字
 * @param {string} guid
 * @param {*} pos
 * @param {*} text
 * @param {*} papiadd
 */
function create_StaticFloatingText(guid, pos, text, papi = true) {
  let staticFloatingText = new StaticFloatingText(pos, text, papi)
  floatingTextData.set(guid, {
    pos: {
      x: pos.x,
      y: pos.y,
      z: pos.z,
      dimid: pos.dimid,
    },
    text: text,
  })
  Running[guid] = staticFloatingText
  staticFloatingText.updateClients()
}

/**
 * 删除悬浮字
 * @param {string} guid
 */
function delete_StaticFloatingText(guid) {
  if (Running.hasOwnProperty(guid)) {
    let staticFloatingText = Running[guid]
    staticFloatingText.destroy()
    floatingTextData.delete(guid)
    delete Running[guid]
  }
}


function UpdateInit(pl, guid) {
  let guild = guilds.get(guid)

  // 如果不存在guildInfo.chatTitle，那么初始化其值
  if (!guilds.get(guid)?.chatTitle) {
    guild.chatTitle = guild.name
  }

  // 如果没有tpPoints就创建tpPoints
  if (!guilds.get(guid)?.tpPoints) {
    guild.tpPoints = []
  }

  guilds.set(guid, guild)
}


function getGuildTitle(pl) {
  if (!playerData.get(pl.xuid)) {
    return ""
  }
  let guid = playerData.get(pl.xuid)["Guid"]
  if (!guid) {
    return ""
  } else {
    let guildInfo = GuildInfo(pl.xuid)
    if (!guildInfo.chatTitle) {
      return ""
    }
    return guildInfo.chatTitle
  }
}
function getGuildName(pl) {
  if (!playerData.get(pl.xuid)) {
    return "无公会"
  }
  let guid = playerData.get(pl.xuid)["Guid"]
  if (!guid) {
    return "无公会"
  } else {
    let guildInfo = GuildInfo(pl.xuid)
    if (!guildInfo.name) {
      return "无公会"
    }
    return guildInfo.name
  }
}
function getGuildTitleSpace(pl) {

  if (!playerData.get(pl.xuid)) {
    return ""
  }

  let guid = playerData.get(pl.xuid)["Guid"]
  if (!guid) {
    return ""
  } else {
    let guildInfo = GuildInfo(pl.xuid)
    if (!guildInfo.chatTitle) {
      return ""
    }
    return `§r§6${guildInfo.chatTitle}§r `
  }
}
PAPI.registerPlayerPlaceholder(getGuildName, "Guild", "guild_name")
PAPI.registerPlayerPlaceholder(getGuildTitle, "Guild", "guild_title")
PAPI.registerPlayerPlaceholder(getGuildTitleSpace, "Guild", "guild_title_space")