import fs from 'node:fs/promises';
import process from 'node:process';
import path from 'node:path';
import os from 'node:os';
import type url from 'node:url';
import decompress from 'decompress';
import decompressTarxz from 'decompress-tarxz';
import decompressUnzip from 'decompress-unzip';
import { config } from '~/configs';
import { logger } from '~/logger';
import { buildURL, requestDownload } from '~/utils';

/**
 * Download arguments.
 */
export type DownloadArgs = {
  /**
   * URL.
   */
  url?: url.URL;
  /**
   * Destination path.
   */
  destination: string;
  /**
   * OS platform.
   */
  platform?: NodeJS.Platform;
  /**
   * CPU architecture.
   */
  architecture?: NodeJS.Architecture;
};

/**
 * Download ShellCheck.
 *
 * @param args - Arguments.
 */
export async function download(args: DownloadArgs): Promise<void> {
  let tmpDir: string | undefined;
  const { destination } = args;
  const platform = args.platform ?? process.platform;
  const architecture = args.architecture ?? process.arch;
  const binArchive = `shellcheck${platform === 'win32' ? '.exe' : ''}`;

  try {
    // Check destination
    await fs.access(path.dirname(destination), fs.constants.W_OK);

    // Temporary directory
    logger.debug(`Creating temporary directory`);
    tmpDir = await fs.mkdtemp(`${os.tmpdir()}${path.sep}`);

    const archive = path.normalize(`${tmpDir}/shellcheck.download`);
    const shellcheck = path.normalize(`${tmpDir}/${binArchive}`);

    // Build URL
    logger.debug(`Building download URL`);
    const downloadURL =
      args.url ?? (await buildURL({ platform, architecture }));

    // Download
    logger.info(`Downloading '${downloadURL}' to '${archive}'`);
    await requestDownload({ url: downloadURL, destination: archive });

    // Extract
    logger.info(`Extracting '${archive}' to '${path.dirname(shellcheck)}'`);
    await decompress(archive, path.dirname(shellcheck), {
      plugins: [decompressTarxz(), decompressUnzip()],
      strip: 1,
      filter: (file) => file.path === binArchive
    });

    // Permissions
    logger.debug(
      `Changing permissions '${config.mode.toString(8)}' of '${shellcheck}'`
    );
    await fs.chmod(shellcheck, config.mode);

    // Move
    logger.info(`Moving '${shellcheck}' to '${destination}'`);
    await fs.rename(shellcheck, destination);
  } finally {
    if (tmpDir) {
      try {
        logger.debug(`Removing temporary directory '${tmpDir}'`);
        await fs.rm(tmpDir, { recursive: true, force: true });
      } catch {
        /* empty */
      }
    }
  }
}
