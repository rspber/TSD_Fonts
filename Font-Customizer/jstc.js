/*
  js tutanchamon constructions framework 1.0

  Copyright (c) 2023, rspber (https://github.com/rspber)
  All rights reserved

*/

function element(e) // , class, innerHTML
{
  let d = document.createElement(e)
  if (arguments.length > 1) {
    d.className = arguments[1]
  }
  if (arguments.length > 2) {
    d.innerHTML = arguments[2]
  }
  return d
}

function append(d)
{
  for (let i = 1; i < arguments.length; ++i) {
    d.appendChild(arguments[i])
  }
  return d
}

function remove(d)
{
  for (let i = 1; i < arguments.length; ++i) {
    d.removeChild(arguments[i])
  }
  return d
}

function hasClass(e, c)
{
  return e.classList.contains(c)
}

function addClass(e, c)
{
  return e.classList.add(c)
}

function removeClass(e, c)
{
  return e.classList.remove(c)
}

function on(b, e, h)
{
  b.addEventListener ? b.addEventListener(e,h) : b.attachEvent && b.attachEvent(e, h)
}

function val(e)
{
  if (e.tagName === "INPUT")
    return e.value
  else
    return e.textContent
}

function ival(e)
{
  return parseInt(val(e))
}

function setval(e, v)
{
  if (e.tagName === "INPUT")
    e.value = v
  else
    e.textContent = v
}
