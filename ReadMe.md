# async-guard

## Installation

```sh
npm install --save async-guard
```

## Protect your async operations from hammering

How often have you worried that an asynchronous operation like this would be called way too many times or even just
twice in quick succession, before a service was able to respond with the first answer?

```js
exports.createUser = function (userName, password, cb) {
    var postData = {
        userName: userName,
        password: password
    };

    httpsPost('http://example.com/some/service/create', postData, cb);
};
```

Perhaps not enough. Consider the possibility that someone hammers your server with a few too many clicks on the "login",
"create user" or other button. Did you just create a user once, then tried again and got an error because the username is
taken? Do we now have two users? Very often race conditions like this can cause a degraded user experience.

## A solution

With async-guard, you can protect yourself from these situations. Let's turn the example above into a safer version:

```js
var callbacks = require('async-guard')();

exports.createUser = function (userName, password, cb) {
    if (!callbacks.add(userName, cb)) {
        return;
    }

    var postData = {
        userName: userName,
        password: password
    };

    httpsPost('http://example.com/some/service/create', postData, function (error, result) {
        callbacks.run(userName, [error, result], console.error);
    });
};
```

**So what is going on there?**

We register the callback with an instance of async-guard, and contextualize it by userName (which is a string, but we
could use any object). When the `add` method returns `false`, it means this callback wasn't the first to be added to the
list for this userName. That means we do not have to continue with our function execution.

Only the first time (when `add` returned `true`) will we execute `httpsPost`. Once that asynchronous operation returns,
we call `callbacks.run` for the `userName` context, and pass the arguments that we want to pass along to all the
callbacks that have been registered.

Indeed, all callbacks that were passed in will be called. We're not just calling the first, or the last... We *will*
call every single callback that was added through `callbacks.add()`, regardless of `add` returning `true` or `false`.
That can be a pitfall, or a blessing. That depends on your use case.

The third and final argument that we're passing (`console.error`) will be called if *any* of the callbacks threw an
exception. This way we can log errors. But rest assured, whether or not a callback throws, all callbacks will be
executed.

After all callbacks have executed, they are all forgotten, so they will never run again. This follows the principle we
support that a callback should always be counted on to run exactly once.

## License

MIT, enjoy!
