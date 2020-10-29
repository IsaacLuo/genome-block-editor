/**
 * get the reverse complement of sequence
 * @param seq 
 */
export default function rc(seq:string) {
    const dict = {'a':'t', 't':'a', 'c':'g', 'g':'c', 'A':'T', 'T':'A', 'C':'G', 'G':'C', 'n':'n', 'N':'N'};
    return seq.split('').map(v=>dict[v]).reverse().join('');
}
