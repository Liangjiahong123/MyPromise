const PROMISE_STATUS = {
  PENDING: 'pending',
  FULFILLED: 'fulfilled',
  REJECTED: 'rejected'
};

const isFunc = (fn) => {
  return Object.prototype.toString.call(fn) === '[object Function]';
};

const isObj = (o) => {
  return Object.prototype.toString.call(o) === '[object Object]';
};

const execFnWithCatchErr = (fn, value, resolve, reject) => {
  try {
    const result = fn(value);
    // 判断返回的是不是promise, 或是带then方法的对象
    if (result instanceof MyPromise || (isObj(result) && isFunc(result.then))) {
      result.then(resolve, reject);
    } else {
      // 否则resolve出去
      resolve(result);
    }
  } catch (err) {
    reject(err);
  }
};

class MyPromise {
  constructor(executor) {
    this.status = PROMISE_STATUS.PENDING;
    this.value = undefined;
    this.reason = undefined;
    this.onFulfillFns = [];
    this.onRejectFns = [];

    const resolve = (value) => {
      if (this.status === PROMISE_STATUS.PENDING) {
        this.status = PROMISE_STATUS.FULFILLED;
        this.value = value;
        this.onFulfillFns.forEach((fn) => fn(value));
      }
    };

    const reject = (reason) => {
      if (this.status === PROMISE_STATUS.PENDING) {
        this.status = PROMISE_STATUS.REJECTED;
        this.reason = reason;
        this.onRejectFns.forEach((fn) => fn(reason));
      }
    };

    try {
      executor(resolve, reject);
    } catch (err) {
      reject(err);
    }
  }

  then(onFulfilled, onRejected) {
    // 当第二个参数为undefined时，将错误抛出给catch处理
    const defOnRejected = (reason) => {
      throw reason;
    };
    const defonFulfilled = (value) => value;
    onFulfilled = isFunc(onFulfilled) ? onFulfilled : defonFulfilled;
    onRejected = isFunc(onRejected) ? onRejected : defOnRejected;

    return new MyPromise((reslove, reject) => {
      const isFulfilled = this.status === PROMISE_STATUS.FULFILLED;
      const isRejected = this.status === PROMISE_STATUS.REJECTED;
      const isPending = this.status === PROMISE_STATUS.PENDING;
      // 如果在调用时，promise的状态已经确定，那么可以直接将回调加入任务队列
      if (isFulfilled) {
        queueMicrotask(() => execFnWithCatchErr(onFulfilled, this.value, reslove, reject));
      }

      if (isRejected) {
        queueMicrotask(() => execFnWithCatchErr(onRejected, this.reason, reslove, reject));
      }

      // 如果是pending状态，那么需要将回调添加到数组保存
      if (isPending) {
        this.onFulfillFns.push((res) =>
          queueMicrotask(() => execFnWithCatchErr(onFulfilled, res, reslove, reject))
        );
        this.onRejectFns.push((err) =>
          queueMicrotask(() => execFnWithCatchErr(onRejected, err, reslove, reject))
        );
      } else {
        this.onFulfillFns = [];
        this.onRejectFns = [];
      }
    });
  }

  catch(onRejected) {
    return this.then(undefined, onRejected);
  }

  finally(onFinallyed) {
    return this.then(
      (value) => {
        if (isFunc(onFinallyed)) onFinallyed();
        return value;
      },
      (reason) => {
        if (isFunc(onFinallyed)) onFinallyed();
        throw reason;
      }
    );
  }

  static resolve(value) {
    if (value instanceof MyPromise) return value;
    if (isObj(value) && isFunc(value.then)) return new MyPromise(value.then);
    return new MyPromise((resolve) => resolve(value));
  }

  static reject(reason) {
    return new MyPromise((reslove, reject) => reject(reason));
  }

  static all(promises) {
    return new MyPromise((resolve, reject) => {
      const values = [];
      let resolvedCount = 0;

      promises.forEach((promise, index) => {
        MyPromise.resolve(promise).then(
          (value) => {
            values[index] = value;
            resolvedCount++;
            if (resolvedCount === promises.length) resolve(values);
          },
          (reason) => reject(reason)
        );
      });
    });
  }

  static allSettled(promises) {
    return new MyPromise((resolve, reject) => {
      const results = [];
      let finishedCount = 0;
      promises.forEach((promise, index) => {
        MyPromise.resolve(promise).then(
          (value) => {
            results[index] = { status: PROMISE_STATUS.FULFILLED, value };
            finishedCount++;
            if (finishedCount === promises.length) resolve(results);
          },
          (reason) => {
            results[index] = { status: PROMISE_STATUS.REJECTED, reason };
            finishedCount++;
            if (finishedCount === promises.length) resolve(results);
          }
        );
      });
    });
  }

  static race(promises) {
    return new MyPromise((resolve, reject) => {
      promises.forEach((promise) => {
        MyPromise.resolve(promise).then(resolve, reject);
      });
    });
  }

  static any(promises) {
    return new MyPromise((resolve, reject) => {
      const reasons = [];
      let rejectedCount = 0;
      promises.forEach((promise, index) => {
        MyPromise.resolve(promise).then(resolve, (reason) => {
          reasons[index] = reason;
          rejectedCount++;
          if (rejectedCount === promises.length) reject(new AggregateError(reasons));
        });
      });
    });
  }
}
const p = MyPromise.resolve({
  then(reslove, reject) {
    reject('error');
  }
}).catch(console.log);

p2.then((res) => 2)
  .then(
    (value) => {
      console.log('调用finally的回调');
      return res;
    },
    (reason) => {
      console.log('调用finally的回调');
      throw reason;
    }
  )
  .then(console.log);
