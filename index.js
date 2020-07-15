const { within } = require("@testing-library/dom");
const assert = require("assert");
const { JSDOM } = require("jsdom");
const { performance } = require("perf_hooks");

function setup() {
  const { window } = new JSDOM(`
<html>
  <body>
    <div>
      <table>
        <tbody>
          <tr>
            <td>1</td>
            <td>2</td>
            <td>3</td>
            <td>4</td>
            <td>5</td>
            <td>6</td>
            <td>7</td>
            <td>8</td>
          </tr>
        </tbody>
      </table>
    </div>
  </body>
</html>
`);
  return { screen: within(window.document.body) };
}

function performRun(screen) {
  assert.ok(screen.getByRole("cell", { name: "1" }));
  assert.ok(screen.getByRole("cell", { name: "2" }));
  assert.ok(screen.getByRole("cell", { name: "3" }));
  assert.ok(screen.getByRole("cell", { name: "4" }));
  assert.ok(screen.getByRole("cell", { name: "5" }));
  assert.ok(screen.getByRole("cell", { name: "6" }));
  assert.ok(screen.getByRole("cell", { name: "7" }));
  assert.ok(screen.getByRole("cell", { name: "8" }));
}

function main({ runCount }) {
  const runs = Array(runCount);

  for (let run = 0; run < runs.length; run += 1) {
    const { screen } = setup();

    const start = performance.now();
    performRun(screen);
    runs[run] = performance.now() - start;
  }

  const median = runs[runCount >> 1];
  const sum = runs.reduce((partialSum, runtime) => partialSum + runtime);
  const average = sum / runs.length;

  console.log(
    "median: %fms, average: %fms, sum: %fms",
    median.toFixed(4),
    average.toFixed(4),
    sum.toFixed(2)
  );
}

main({ runCount: +process.argv[2] });
