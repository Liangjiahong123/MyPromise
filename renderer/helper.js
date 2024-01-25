function mountComponent(vnode, container) {
  // 调用组件函数，获取要渲染的内容
  // const component = vnode.tag();
  const component = vnode.tag.render();
  // 递归地调用 renderer 渲染 component
  renderer(component, container);
}

function mountElement(vnode, container) {
  const el = document.createElement(vnode.tag);
  // 遍历 vnode.props,将属性、事件添加到DOM元素
  for (const key in vnode.props) {
    if (key.startsWith('on')) {
      el.addEventListener(key.slice(2).toLowerCase(), vnode.props[key]);
    } else {
      el.setAttribute(key, vnode.props[key]);
    }
  }

  // 如果有子节点，递归渲染子节点
  if (typeof vnode.children === 'string') {
    const textNode = document.createTextNode(vnode.children);
    el.appendChild(textNode);
  } else if (Array.isArray(vnode.children)) {
    vnode.children.forEach((child) => renderer(child, el));
  }

  // 将DOM元素添加到容器
  container.appendChild(el);
}
