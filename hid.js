const HID = require('node-hid');

// const devices = HID.devices();
// console.log('HID 设备列表:', devices);
// const xbox = devices.find(d => d.vendorId === 1118);

// if (!xbox) {
//   console.error('找不到Xbox 360手柄!');
//   process.exit(1);
// }

// const device = new HID.HID(xbox.path);

const MAX_UINT16 = 2 ** 16 - 1
const MAX_INT16 = 2 ** 15 - 1

// list all HID devices
function listAll() {
  return HID.devices();
}

function listControllers(product) {
  product = product || 'Xbox Wireless Controller';

  var devices = listAll();
  console.log('所有HID设备:', devices);

  var xboxcontrollers = devices.filter(function(dev) {
    return dev.product === product;
  });

  return xboxcontrollers;
}

function bitMask(byte, bitmask) {
  return !!(byte & bitmask)
}

const devices = listControllers()

console.log('找到手柄设备:', devices);

if (devices.length > 0) {
  const device = new HID.HID(devices[0].path);

  device.on('data', data => {

    const leftThumbHorizontal = (data.readUInt16LE(1) / MAX_UINT16) * 2 - 1
    const leftThumbVertical = (data.readUInt16LE(3) / MAX_UINT16) * 2 - 1

    // console.log('左摇杆水平轴:', leftThumbHorizontal.toFixed(2), '垂直轴:', leftThumbVertical.toFixed(2));

    const rightThumbHorizontal = (data.readUInt16LE(5) / MAX_UINT16) * 2 - 1
    const rightThumbVertical = (data.readUInt16LE(7) / MAX_UINT16) * 2 - 1

    // console.log('右摇杆水平轴:', rightThumbHorizontal.toFixed(2), '垂直轴:', rightThumbVertical.toFixed(2));

    let leftTrigger = data[9]

    const leftTriggerAlias = data[10] & 0b00000011
    const leftTriggerOneQuarter = leftTriggerAlias === 0b00000001
    const leftTriggerTwoQuarterPress = leftTriggerAlias === 0b00000010
    const leftTriggerThreeQuarterPress = leftTriggerAlias === 0b00000011

    if (leftTriggerOneQuarter) leftTrigger = leftTrigger + 256 + 1
    if (leftTriggerTwoQuarterPress) leftTrigger = leftTrigger + 256 * 2 + 1
    if (leftTriggerThreeQuarterPress) leftTrigger = leftTrigger + 256 * 3 + 1
    leftTrigger = leftTrigger / 1024

    // console.log('左扳机值:', leftTrigger.toFixed(2));

    let rightTrigger = data[11]

    // 12
    const rightTriggerAlias = data[12] & 0b00000011
    const rightTriggerOneQuarter = rightTriggerAlias === 0b00000001
    const rightTriggerTwoQuarterPress = rightTriggerAlias === 0b00000010
    const rightTriggerThreeQuarterPress = rightTriggerAlias === 0b00000011

    if (rightTriggerOneQuarter) rightTrigger = rightTrigger + 256 + 1
    if (rightTriggerTwoQuarterPress) rightTrigger = rightTrigger + 256 * 2 + 1
    if (rightTriggerThreeQuarterPress) rightTrigger = rightTrigger + 256 * 3 + 1
    rightTrigger = rightTrigger / 1024

    // console.log('右扳机值:', rightTrigger.toFixed(2));

    const dPad = data[13] & 0b00001111
    const dUp = dPad === 0b00000001 || dPad === 0b00000010 || dPad === 0b00001000
    const dDown = dPad === 0b00000101 || dPad === 0b00000100 || dPad === 0b00000110
    const dLeft = dPad === 0b00000111 || dPad === 0b00000110 || dPad === 0b00001000
    const dRight = dPad === 0b00000011 || dPad === 0b00000100 || dPad === 0b00000010

    // console.log('方向键状态 - 上:', dUp, '下:', dDown, '左:', dLeft, '右:', dRight);

    const a = bitMask(data[14], 0b00000001)
    const b = bitMask(data[14], 0b00000010)
    const x = bitMask(data[14], 0b00001000)
    const y = bitMask(data[14], 0b00010000)
    const leftBumper = bitMask(data[14], 0b01000000)
    const rightBumper = bitMask(data[14], 0b10000000)

    // console.log('A 按钮状态:', a);
    // console.log('B 按钮状态:', b);
    // console.log('X 按钮状态:', x);
    // console.log('Y 按钮状态:', y);
    // console.log('左肩键状态:', leftBumper);
    // console.log('右肩键状态:', rightBumper);

    const start = bitMask(data[15], 0b00001000)
    const back = bitMask(data[15], 0b00000100)

    // console.log('start状态:', start);
    // console.log('back状态:', back);

    const thumbLeftPressed = bitMask(data[15], 0b00100000)
    const thumbRightPressed = bitMask(data[15], 0b01000000)

    // console.log('左摇杆按下状态:', thumbLeftPressed);
    // console.log('右摇杆按下状态:', thumbRightPressed);

    const capture = bitMask(data[16], 0b00000001)
    // console.log('capture键状态:', capture);

  });
}
