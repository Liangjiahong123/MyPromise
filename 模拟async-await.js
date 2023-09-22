function requestApi(params) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(params);
    }, 1000);
  });
}

function execGenerator(GeneFun) {
  const generator = GeneFun();
  function exec(res) {
    const result = generator.next(res);
    if (result.done) return; // 如果result.done为true,则代表生成器函数执行完毕
    // 如果result.done为false,则代表生成器函数执行中
    result.value.then((res) => {
      // 继续调用exec，把下一个yield的值传入，知道result.done为true为止
      exec(res);
    });
  }

  exec();
}

execGenerator(function* () {
  const res1 = yield requestApi('Jimmy');
  const res2 = yield requestApi(res1 + 'aaa');
  const res3 = yield requestApi(res2 + 'bbb');
  console.log(res3);
});
