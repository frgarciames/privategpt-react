import { CornerDownLeft, Paperclip, StopCircle } from 'lucide-react';
import { FormEvent, useEffect, useRef, useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useFiles, usePrompt } from 'privategpt-ts/react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Link } from 'react-router-dom';
import { PrivategptApi } from 'privategpt-ts';
import { PrivategptClient } from '@/lib/pgpt';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { marked } from 'marked';
import { useLocalStorage } from 'usehooks-ts';

const MODES = [
  {
    value: 'query',
    title: 'Query docs',
    description:
      'Uses the context from the ingested documents to answer the questions',
  },
  {
    value: 'search',
    title: 'Search files',
    description: 'Fast search that returns the 4 most related text chunks',
  },
  {
    value: 'prompt',
    title: 'Prompt',
    description: 'No context from files',
  },
] as const;

export function Prompt() {
  const messageRef = useRef<HTMLTextAreaElement>(null);
  const [mode, setMode] = useLocalStorage<(typeof MODES)[number]['value']>(
    'pgpt-prompt-mode',
    'prompt',
  );
  const [sources, setSources] = useLocalStorage(
    'pgpt-sources',
    [] as PrivategptApi.Chunk[],
  );
  const [environment] = useLocalStorage('pgpt-url', '');
  const [input, setInput] = useState('');
  const [prompt, setPrompt] = useState<string>('');
  const [systemPrompt, setSystemPrompt] = useLocalStorage<string>(
    'system-prompt',
    '',
  );
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const { completion, isLoading, stop, setCompletion } = usePrompt({
    client: PrivategptClient.getInstance(environment),
    prompt,
    useContext: mode === 'query',
    enabled: prompt.length > 0 && ['query', 'prompt'].includes(mode),
    onFinish: ({ sources }) => {
      setSources(sources);
      setTimeout(() => {
        messageRef.current?.focus();
      }, 100);
    },
    includeSources: mode === 'query',
    systemPrompt,
    contextFilter: selectedFiles,
  });
  const { addFile, files, deleteFile, isUploadingFile, isFetchingFiles } =
    useFiles({
      client: PrivategptClient.getInstance(environment),
      fetchFiles: true,
    });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!input) return;
    const content = input.trim();
    addPrompt(content);
    if (mode === 'search') {
      searchDocs(content);
    }
  };

  const addPrompt = (message: string) => {
    setPrompt(message);
    setInput('');
  };

  const searchDocs = async (input: string) => {
    const chunks = await PrivategptClient.getInstance(
      environment,
    ).contextChunks.chunksRetrieval({ text: input });
    const content = chunks.data.reduce((acc, chunk, index) => {
      return `${acc}**${index + 1}.${
        chunk.document.docMetadata?.file_name
      } (page ${chunk.document.docMetadata?.page_label})** \n\n ${
        chunk.document.docMetadata?.original_text
      } \n\n`;
    }, '');
    setCompletion(content);
  };

  useEffect(() => {
    window.scrollTo(0, document.body.scrollHeight);
  }, [completion]);

  useEffect(() => {
    setSources([]);
  }, [prompt]);

  return (
    <div className="grid h-screen w-full">
      <div className="flex flex-col">
        <header className="sticky top-0 z-10 justify-between flex h-[57px] items-center gap-1 border-b bg-background px-4">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-semibold">Playground</h1>
            <Link to="/chat">Go to chat</Link>
          </div>
          <Button
            variant="ghost"
            onClick={() => {
              setPrompt('');
              setCompletion('');
            }}
          >
            Clear
          </Button>
        </header>
        <main className="grid flex-1 gap-4 p-4 md:grid-cols-2 lg:grid-cols-3">
          <div
            className="hidden flex-col items-start gap-8 md:flex"
            x-chunk="dashboard-03-chunk-0"
          >
            <form className="grid w-full items-start gap-6 sticky top-20">
              <fieldset className="grid gap-6 rounded-lg border p-4">
                <legend className="-ml-1 px-1 text-sm font-medium">Mode</legend>
                <div className="grid gap-3">
                  <Select value={mode} onValueChange={setMode as any}>
                    <SelectTrigger
                      id="mode"
                      className="items-start [&_[data-description]]:hidden"
                    >
                      <SelectValue placeholder="Select a mode" />
                    </SelectTrigger>
                    <SelectContent>
                      {MODES.map((mode) => (
                        <SelectItem key={mode.value} value={mode.value}>
                          <div className="flex items-start gap-3 text-muted-foreground">
                            <div className="grid gap-0.5">
                              <p>{mode.title}</p>
                              <p className="text-xs" data-description>
                                {mode.description}
                              </p>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </fieldset>
              <fieldset
                className={cn('grid gap-6 rounded-lg border p-4', {
                  'bg-muted/50': isUploadingFile || isFetchingFiles,
                })}
              >
                <legend className="-ml-1 px-1 text-sm font-medium">
                  Files
                </legend>
                {isFetchingFiles ? (
                  <p>Fetching files...</p>
                ) : (
                  <div className="grid gap-3">
                    {files && files.length > 0 ? (
                      files.map((file, index) => (
                        <div
                          key={index}
                          className="flex justify-between items-center"
                        >
                          <p>{file.fileName}</p>
                          <Button
                            variant="destructive"
                            size="icon"
                            className="size-6"
                            onClick={(e) => {
                              e.preventDefault();
                              deleteFile(file.fileName);
                              setSelectedFiles(selectedFiles.filter(f => f !== file.fileName));
                            }}
                          >
                            x
                          </Button>
                          <input
                            type="checkbox"
                            checked={selectedFiles.includes(file.fileName)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedFiles([...selectedFiles, file.fileName]);
                              } else {
                                setSelectedFiles(selectedFiles.filter(f => f !== file.fileName));
                              }
                            }}
                          />
                        </div>
                      ))
                    ) : (
                      <p>No files ingested</p>
                    )}
                    {isUploadingFile && <p>Uploading file...</p>}
                  </div>
                )}
              </fieldset>
              <div className="grid gap-3">
                <Label htmlFor="content">System prompt</Label>
                <Textarea
                  id="content"
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  placeholder="You are a..."
                  className="min-h-[9.5rem]"
                />
              </div>
            </form>
          </div>
          <div className="relative flex-col flex h-full space-y-4 flex- rounded-xl bg-muted/50 p-4 lg:col-span-2">
            <Badge
              variant="outline"
              className="absolute right-3 top-3 bg-muted/100"
            >
              Output
            </Badge>
            <div className="flex-1">
              <div className="flex flex-col space-y-4">
                {prompt && (
                  <div
                    className={cn(
                      'h-fit p-3 grid gap-2 shadow-lg rounded-xl w-fit self-start',
                    )}
                  >
                    <Badge variant="outline" className="w-fit bg-muted/100">
                      user
                    </Badge>
                    <div
                      className="text-sm prose marker:text-black"
                      dangerouslySetInnerHTML={{
                        __html: marked.parse(prompt),
                      }}
                    />
                  </div>
                )}
                {completion && (
                  <div className="h-fit p-3 grid gap-2 shadow-lg rounded-xl w-full self-end bg-violet-200">
                    <Badge variant="outline" className="w-fit bg-muted/100">
                      assistant
                    </Badge>
                    <div
                      className="text-sm prose text-black marker:text-black"
                      dangerouslySetInnerHTML={{
                        __html: marked.parse(completion),
                      }}
                    />
                    {sources?.length > 0 && (
                      <div>
                        <p className="font-bold">Sources:</p>
                        {sources.map((source) => (
                          <p key={source.document.docId}>
                            <strong>
                              {source.document.docMetadata?.file_name as string}
                            </strong>
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <form
              className="relative overflow-hidden rounded-lg border bg-background focus-within:ring-1 focus-within:ring-ring"
              x-chunk="dashboard-03-chunk-1"
              onSubmit={handleSubmit}
            >
              <Label htmlFor="message" className="sr-only">
                Message
              </Label>
              <Textarea
                id="message"
                ref={messageRef}
                disabled={isLoading}
                placeholder="Type your message here..."
                className="min-h-12 resize-none border-0 p-3 shadow-none focus-visible:ring-0"
                value={input}
                name="content"
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    event.currentTarget.form?.dispatchEvent(
                      new Event('submit', { bubbles: true }),
                    );
                  }
                }}
                autoFocus
                onChange={(event) => setInput(event.target.value)}
              />
              <div className="flex items-center p-3 pt-0">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        type="button"
                        onClick={() => {
                          const input = document.createElement(
                            'input',
                          ) as HTMLInputElement;
                          input.type = 'file';
                          input.onchange = (e) => {
                            const file = (e.target as HTMLInputElement)
                              ?.files?.[0];
                            if (!file) return;
                            addFile(file);
                          };
                          input.click();
                          input.remove();
                        }}
                      >
                        <Paperclip className="size-4" />
                        <span className="sr-only">Attach file</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">Attach File</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                {isLoading ? (
                  <Button
                    type="button"
                    onClick={stop}
                    size="sm"
                    className="ml-auto gap-1.5"
                  >
                    Stop
                    <StopCircle className="size-3.5" />
                  </Button>
                ) : (
                  <Button type="submit" size="sm" className="ml-auto gap-1.5">
                    Send Message
                    <CornerDownLeft className="size-3.5" />
                  </Button>
                )}
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
