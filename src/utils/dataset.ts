import fs from "fs/promises";
import { join } from "path";

export function resetDataset(name: string) {
  return fs.rm(join("storage/datasets", name), {
    recursive: true,
    force: true,
  });
}
