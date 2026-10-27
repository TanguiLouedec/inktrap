import { parseArgs } from "node:util";
import { buildManifests } from "./build";

export interface RunOptions {
  /** Where normal output goes. Defaults to `process.stdout`. */
  stdout?: (text: string) => void;
  /** Where errors go. Defaults to `process.stderr`. */
  stderr?: (text: string) => void;
  /** Printed by `--version`. */
  version?: string;
}

const help = `Usage: inktrap build <dir> --out <dir> [--base-url <url>]

Reads every font file (.ttf, .otf, .woff, .woff2) under <dir> and writes one
JSON manifest per font family to the output folder.

Options:
  -o, --out <dir>       Folder to write the manifests to (required)
      --base-url <url>  Prefix for each face's src, e.g. /fonts/ or a CDN URL.
                        Without it, src is the font's path relative to <dir>.
  -h, --help            Show this help
  -v, --version         Show the version
`;

class UsageError extends Error {}

/**
 * Runs the CLI with the given arguments (without `node` and the script path) and returns the
 * exit code: 0 on success, 1 when building fails, 2 for usage errors.
 */
export const run = async (argv: readonly string[], options: RunOptions = {}): Promise<number> => {
  const {
    stdout = (text: string) => process.stdout.write(text),
    stderr = (text: string) => process.stderr.write(text),
    version = "unknown",
  } = options;
  try {
    const { values, positionals } = parseArgs({
      args: [...argv],
      allowPositionals: true,
      options: {
        out: { type: "string", short: "o" },
        "base-url": { type: "string" },
        help: { type: "boolean", short: "h" },
        version: { type: "boolean", short: "v" },
      },
    });

    if (values.help) {
      stdout(help);
      return 0;
    }
    if (values.version) {
      stdout(`${version}\n`);
      return 0;
    }

    const [command, dir, ...rest] = positionals;
    if (!command) throw new UsageError("missing command");
    if (command !== "build") throw new UsageError(`unknown command "${command}"`);
    if (!dir) throw new UsageError("missing <dir>");
    if (rest.length) throw new UsageError(`unexpected argument "${rest[0]}"`);
    if (!values.out) throw new UsageError("--out is required");

    const built = await buildManifests({ dir, out: values.out, baseUrl: values["base-url"] });
    for (const { file, manifest } of built) {
      const faces = manifest.faces.length;
      stdout(`wrote ${file} (${manifest.family}, ${faces} ${faces === 1 ? "face" : "faces"})\n`);
    }
    return 0;
  } catch (error) {
    const { message, path, code } = error as Error & { path?: unknown; code?: unknown };
    // parseArgs throws for unknown options and missing option values.
    if (error instanceof UsageError || (typeof code === "string" && code.startsWith("ERR_PARSE_ARGS"))) {
      stderr(`inktrap: ${message}\nRun "inktrap --help" for usage.\n`);
      return 2;
    }
    // FontReadError carries the file; name it unless the message already does.
    const where = typeof path === "string" && !message.includes(path) ? `${path}: ` : "";
    stderr(`inktrap: ${where}${message}\n`);
    return 1;
  }
};
