const vnode = {
  tag: 'div',
  props: {
    onClick: () => alert('hello'),
    class: 'foo'
  },
  children: 'click me'
};

const MyComponent = () => {
  return {
    tag: 'div',
    props: {
      onClick: () => alert('hello myComponent'),
      class: 'foo'
    },
    children: 'click myComponent'
  };
};
const MyComponentB = {
  render() {
    return {
      tag: 'div',
      props: {
        onClick: () => alert('hello myComponentB'),
        class: 'fooB'
      },
      children: 'click myComponentB'
    };
  }
};

const vnodeC = {
  tag: MyComponent
};

function renderer(vnode, container) {
  // 判断 vnode.tag 的类型是标签还是组件
  // if (typeof vnode.tag === 'function') {
  //   // 说明 vnode 描述的是组件
  //   mountComponent(vnode, container);
  // } else if (typeof vnode.tag === 'string') {
  //   // 说明 vnode 描述的是标签元素
  //   mountElement(vnode, container);
  // }

  if (typeof vnode.tag === 'object') {
    // 说明 vnode 描述的是组件
    mountComponent(vnode, container);
  } else if (typeof vnode.tag === 'string') {
    // 说明 vnode 描述的是标签元素
    mountElement(vnode, container);
  }
}

renderer(vnode, document.body);
renderer(vnodeC, document.body);
