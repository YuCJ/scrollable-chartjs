import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Line } from "react-chartjs-2";

const getShouldBeScrollMode = ({
  minXTickWidth, // x軸一格可接受的最小寬度
  xTicksCount, // x軸有幾格
  wrapperWidth // 圖表顯示區塊的大小
}) => {
  if (!xTicksCount || !wrapperWidth) return true
  const tickWidthIfNoScroll = wrapperWidth / xTicksCount
  const isScrollMode = tickWidthIfNoScroll < minXTickWidth
  return isScrollMode
}

export default function ScrollableBar({ minXTickWidth = 150, data, options }) {
  const [isScrollMode, setIsScrollMode] = useState(false);
  const wrapperRef = useRef(null)
  const chartRef = useRef(null);

  const getWrapperWidth = useCallback(
    () => wrapperRef.current?.getBoundingClientRect().width,
    []
  )

  const optionsBasedOnIsScrollMode = useMemo(
    () => ({
      ...options,
      responsive: !isScrollMode
    }),
    [isScrollMode, options]
  );

  const xTicksCount = useMemo(() => {
    const nextXTickCount = data.datasets.reduce((acc, curr) => {
      if (curr.data.length > acc) {
        return curr.data.length;
      }
      return acc;
    }, 0);
    return nextXTickCount;
  }, [data]);

  // 不知道能不能用 <Line options={{ ? }} /> 去 resize
  // 這樣就不需要這個 function
  // 只要在 isScrollMode === true 時加 prop 到 options 裡就好
  const resizeChartBasedPointNumber = useCallback(({ forceResize } = {}) => {
    if (forceResize || isScrollMode) {
      chartRef.current.resize(
        minXTickWidth * xTicksCount,
        350
      );
    }
  }, [isScrollMode, minXTickWidth, xTicksCount]);

  const goScrollMode = useCallback(() => {
    resizeChartBasedPointNumber({ forceResize: true });
    setIsScrollMode(true);
  }, [resizeChartBasedPointNumber]);

  const goRegularMode = useCallback(() => {
    setIsScrollMode(false);
  }, []);

  // Handle `xTicksCount` or `minXTickWidth` changes
  useEffect(() => {
    if (
      getShouldBeScrollMode({
        wrapperWidth: getWrapperWidth(),
        xTicksCount,
        minXTickWidth,
      })
    ) {
      goScrollMode();
    } else {
      goRegularMode()
    }
  }, [
    xTicksCount,
    minXTickWidth,
    goRegularMode,
    goScrollMode,
    getWrapperWidth
  ]);

  // Handle `wrapperWidth` changes:
  // TODO(yucj): Can we use ResizeObserver to observe the wrapper instead?
  useEffect(
    () => {
      const handleWindowResize = () => {
        if (
          getShouldBeScrollMode({
            wrapperWidth: getWrapperWidth(),
            xTicksCount,
            minXTickWidth,
          })
        ) {
          goScrollMode();
        } else {
          goRegularMode()
        }
      };
      window.addEventListener("resize", handleWindowResize);
      return () => window.removeEventListener("resize", handleWindowResize);
    },
    [
      getWrapperWidth,
      goRegularMode,
      goScrollMode,
      minXTickWidth,
      xTicksCount
    ]
  );

  return (
    <div
      style={{
        position: "relative",
        minHeight: "350px",
        width: "100%",
        overflowX: "scroll",
      }}
      ref={wrapperRef}
    >
      <Line
        ref={chartRef}
        options={optionsBasedOnIsScrollMode}
        data={data}
      />
    </div>
  );
}
