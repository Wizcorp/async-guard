module.exports = function asyncGuard() {
	var callbacks = new Map();

	return {
		add: function (key, cb) {
			var arr = callbacks.get(key);
			if (arr) {
				arr.push(cb);
				return false;
			}

			arr = [cb];
			callbacks.set(key, arr);
			return true;
		},
		run: function (key, args, onError) {
			var arr = callbacks.get(key);
			if (!arr) {
				return;
			}

			var errors = [];

			callbacks.delete(key);

			for (var i = 0; i < arr.length; i++) {
				try {
					arr[i].apply(null, args);
				} catch (cbError) {
					errors.push(cbError);
				}
			}

			if (errors.length > 0) {
				if (onError) {
					for (var i = 0; i < errors.length; i += 1) {
						onError(errors[i]);
					}
				} else if (errors.length === 1) {
					throw errors[0];
				} else {
					var error = new Error('Multiple callback errors');
					error.errors = errors;
					throw error;
				}
			}
		}
	};
};
