<template>
  <div>
    <p>Ping 延迟: {{ pingDelay }} ms</p>
    <button @click="checkPing">测试延迟</button>
  </div>
</template>

<script>
export default {
  data() {
    return {
      pingDelay: null,
    };
  },
  async mounted() {
    let IPArr = ["172.16.15.106", "172.17.0.1", "172.18.1.136", "192.168.1.1"];
    // let res = await this.pingFn(IPArr);
    // console.log('res', res); // res {status: true, ip: '192.168.1.1'}
    for (let i = 0; i < IPArr.length; i++) {
      let res = await this.ping(IPArr[i]);
      console.log("res", res);
    }
  },
  methods: {
    // 方法1
    ping(ip) {
      var img = new Image();
      var start = new Date().getTime();
      var flag = false;
      var isCloseWifi = true;
      var hasFinish = false;
      img.onload = function () {
        if (!hasFinish) {
          flag = true;
          hasFinish = true;
          img.src = "X:\\";
          console.log("Ping " + ip + " success. "); // Ping 192.168.1.1 success.
        }
      };
      img.onerror = function () {
        if (!hasFinish) {
          if (!isCloseWifi) {
            flag = true;
            img.src = "X:\\";
            console.log("Ping " + ip + " success. ");
          } else {
            console.log("network is not working!");
          }
          hasFinish = true;
        }
      };
      setTimeout(function () {
        isCloseWifi = false;
        console.log("network is working, start ping...");
      }, 2);
      img.src = "http://" + ip + "/" + start;
      var timer = setTimeout(function () {
        if (!flag) {
          hasFinish = true;
          img.src = "X://";
          flag = false;
          console.log("Ping " + ip + " fail. ");
        }
      }, 15000);
    },
    // 方法2
    pingFn(ips) {
      let promiseArr = [];
      ips.forEach((ip) => {
        let pro = new Promise((res, rej) => {
          var img = new Image();
          var start = new Date().getTime();
          img.src = "http://" + ip + "?t=" + start;
          img.onload = function () {
            res({
              status: true,
              ip,
            });
          };
          img.onerror = function () {
            res({
              status: true,
              ip,
            });
          };
          let timer = setTimeout(() => {
            clearTimeout(timer);
            rej();
          }, 4000);
        });
        promiseArr.push(pro);
      });
      return Promise.any(promiseArr);
    },
  },

  // methods: {
  //   checkPing() {
  //     const imageUrl = `http://39.108.122.78/?t=${Date.now()}`;  // 替换为你的服务器地址
  //     const start = Date.now();

  //     const img = new Image();
  //     img.src = imageUrl;

  //     img.onload = () => {
  //       const end = Date.now();
  //       this.pingDelay = end - start;
  //     };

  //     img.onerror = () => {
  //       this.pingDelay = '请求失败';
  //     };
  //   },
  // },
};
</script>
