echo 🏁🏁🏁Check all🏁🏁🏁


if yarn tslint > /dev/null; then
  echo 👍 tslint SUCCESS
  else
    echo ⛔ tslint FAILED
    exit 0;
fi

if yarn build-ts > /dev/null; then
  echo 👍 build-ts SUCCESS
  else
    echo ⛔ build-ts FAILED
    exit 0;
fi

if yarn start-test & yarn test > /dev/null; then
  echo 👍 tests SUCCESS
  pkill node "yarn start-test"
  else
    echo ⛔ tests FAILED
    exit 0;
fi

echo ⏳ 
sleep 1
echo ⏳ ⏳
sleep 1
echo ⏳ ⏳ ⏳
sleep 1
echo ⏳ ⏳ ⏳ ⏳
sleep 1
echo ⏳ ⏳ ⏳ ⏳ ⏳


echo 💚 CHECK ALL PASSED 💚
exit 0;